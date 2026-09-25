import Conversation from "../models/conversationModel.js";
import messageModel from "../models/messageModel.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

const sendMessage = async (req, res) => {
    try {
        const senderId = req.user?._id || req.user;
        const receiverId = req.params.id;
        const { message, replyTo } = req.body;
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }
        let getConversation = await Conversation.findOne({
            participants: {
                $all: [senderId, receiverId]
            }   
        });
        if (!getConversation) {
            getConversation = await Conversation.create({
                participants: [senderId, receiverId]
            });
        }
        const receiverSocketId = getReceiverSocketId(receiverId);
        const isDelivered = Boolean(receiverSocketId);

        const newMessage = await messageModel.create({
            senderId,
            receiverId,
            content: message,
            delivered: isDelivered,
            seen: false,
            replyTo: replyTo ? {
                _id: replyTo._id,
                content: replyTo.content,
                senderName: replyTo.senderName
            } : undefined
        });
        if (newMessage) {
            getConversation.messages.push(newMessage._id);
            await getConversation.save();

            // Real-time socket delivery
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("newMessage", newMessage);
            }

            return res.status(201).json({
                message: "Message sent successfully",
                success: true,
                newMessage
            });
        }
    } catch (error) {
        console.log("Message sent error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });   
    }
}   

const getMessages = async (req, res) => {
    try {
        const receiverId = req.params.id; // The other participant
        const senderId = req.user?._id || req.user; // The logged-in user

        // Mark all incoming messages from this user as seen & delivered
        await messageModel.updateMany(
            { senderId: receiverId, receiverId: senderId, seen: { $ne: true } },
            { $set: { seen: true, delivered: true } }
        );

        // Notify the other user in real-time that their messages were seen
        const otherUserSocketId = getReceiverSocketId(receiverId);
        if (otherUserSocketId) {
            io.to(otherUserSocketId).emit("messagesSeen", { seenBy: String(senderId) });
        }

        const getConversation = await Conversation.findOne({
            participants: {
                $all: [senderId, receiverId]
            }
        }).populate("messages");

        return res.status(200).json(getConversation?.messages || []);
    } catch (error) {
        console.log("Get messages error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });   
    }
}

const markMessagesSeen = async (req, res) => {
    try {
        const otherUserId = req.params.id;
        const loggedInUserId = req.user?._id || req.user;

        await messageModel.updateMany(
            { senderId: otherUserId, receiverId: loggedInUserId, seen: { $ne: true } },
            { $set: { seen: true, delivered: true } }
        );

        const otherUserSocketId = getReceiverSocketId(otherUserId);
        if (otherUserSocketId) {
            io.to(otherUserSocketId).emit("messagesSeen", { seenBy: String(loggedInUserId) });
        }

        return res.status(200).json({ success: true, message: "Messages marked as seen" });
    } catch (error) {
        console.log("Mark messages seen error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}

const reactToMessage = async (req, res) => {
    try {
        const userId = req.user?._id || req.user;
        const messageId = req.params.id;
        const { emoji } = req.body;

        if (!emoji) {
            return res.status(400).json({ error: "Emoji is required" });
        }

        const message = await messageModel.findById(messageId);
        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }

        const existingReactionIndex = message.reactions.findIndex(
            (r) => String(r.user) === String(userId)
        );

        if (existingReactionIndex > -1) {
            if (message.reactions[existingReactionIndex].emoji === emoji) {
                // Toggle off
                message.reactions.splice(existingReactionIndex, 1);
            } else {
                // Change emoji
                message.reactions[existingReactionIndex].emoji = emoji;
            }
        } else {
            message.reactions.push({ user: userId, emoji });
        }

        await message.save();

        const otherParticipantId =
            String(message.senderId) === String(userId) ? message.receiverId : message.senderId;
        const otherSocketId = getReceiverSocketId(otherParticipantId);
        if (otherSocketId) {
            io.to(otherSocketId).emit("messageReaction", {
                messageId,
                reactions: message.reactions,
            });
        }

        return res.status(200).json({
            success: true,
            messageId,
            reactions: message.reactions,
        });
    } catch (error) {
        console.log("React to message error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
};

const editMessage = async (req, res) => {
    try {
        const userId = req.user?._id || req.user;
        const messageId = req.params.id;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ error: "Message content cannot be empty" });
        }

        const message = await messageModel.findById(messageId);
        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }

        if (String(message.senderId) !== String(userId)) {
            return res.status(403).json({ error: "Unauthorized to edit this message" });
        }

        if (message.isDeleted) {
            return res.status(400).json({ error: "Cannot edit a deleted message" });
        }

        message.content = content.trim();
        message.isEdited = true;
        await message.save();

        const otherSocketId = getReceiverSocketId(message.receiverId);
        if (otherSocketId) {
            io.to(otherSocketId).emit("messageEdited", {
                messageId,
                content: message.content,
                isEdited: true,
            });
        }

        return res.status(200).json({
            success: true,
            message,
        });
    } catch (error) {
        console.log("Edit message error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
};

const deleteMessage = async (req, res) => {
    try {
        const userId = req.user?._id || req.user;
        const messageId = req.params.id;

        const message = await messageModel.findById(messageId);
        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }

        if (String(message.senderId) !== String(userId)) {
            return res.status(403).json({ error: "Unauthorized to delete this message" });
        }

        message.content = "This message was deleted";
        message.isDeleted = true;
        message.reactions = [];
        await message.save();

        const otherSocketId = getReceiverSocketId(message.receiverId);
        if (otherSocketId) {
            io.to(otherSocketId).emit("messageDeleted", {
                messageId,
                isDeleted: true,
            });
        }

        return res.status(200).json({
            success: true,
            messageId,
            message,
        });
    } catch (error) {
        console.log("Delete message error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
};

export { sendMessage, getMessages, markMessagesSeen, reactToMessage, editMessage, deleteMessage };   

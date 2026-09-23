import Conversation from "../models/conversationModel.js";
import messageModel from "../models/messageModel.js";

const sendMessage = async (req, res) => {
    try {
        const senderId = req.user?._id || req.user;
        const receiverId = req.params.id;
        const { message } = req.body;
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
        const newMessage = await messageModel.create({
            senderId,
            receiverId,
            content: message
        });
        if (newMessage) {
            getConversation.messages.push(newMessage._id);
            await getConversation.save();
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

    // SOCKET IO
}   

const getMessages = async (req, res) => {
    try {
        const receiverId = req.params.id;
        const senderId = req.user?._id || req.user;
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

export { sendMessage, getMessages };   

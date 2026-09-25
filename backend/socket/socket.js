import { Server } from "socket.io";
import http from "http";
import express from "express";
import messageModel from "../models/messageModel.js";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
        methods: ["GET", "POST"],
        credentials: true,
    },
});

const userSocketMap = {}; // { userId: socketId }

export const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId];
};

io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log("A user connected:", socket.id, "userId:", userId);

    if (userId && userId !== "undefined") {
        userSocketMap[userId] = socket.id;

        // Mark pending undelivered messages for this user as delivered in DB
        (async () => {
            try {
                const undeliveredMessages = await messageModel.find({
                    receiverId: userId,
                    delivered: false,
                }).select("senderId").lean();

                if (undeliveredMessages.length > 0) {
                    await messageModel.updateMany(
                        { receiverId: userId, delivered: false },
                        { $set: { delivered: true } }
                    );

                    // Notify online senders that their messages are now delivered
                    const senderIds = [...new Set(undeliveredMessages.map((m) => String(m.senderId)))];
                    senderIds.forEach((senderId) => {
                        const senderSocketId = userSocketMap[senderId];
                        if (senderSocketId) {
                            io.to(senderSocketId).emit("messagesDelivered", { receiverId: userId });
                        }
                    });
                }
            } catch (err) {
                console.error("Error updating message delivery status:", err);
            }
        })();
    }

    // Emit online users list to all connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // Live typing indicator events
    socket.on("typing", ({ senderId, receiverId }) => {
        if (!receiverId) return;
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("userTyping", { senderId });
        }
    });

    socket.on("stopTyping", ({ senderId, receiverId }) => {
        if (!receiverId) return;
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("userStoppedTyping", { senderId });
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        if (userId && userSocketMap[userId]) {
            delete userSocketMap[userId];
        }
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

export { app, io, server };
import mongoose from "mongoose";

const messageModel = new mongoose.Schema({
    senderId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    receiverId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    content : {
        type: String,
        required: true
    },
    seen : {
        type: Boolean,
        default: false
    },
    delivered : {
        type: Boolean,
        default: false
    },
    replyTo : {
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message"
        },
        content: {
            type: String
        },
        senderName: {
            type: String
        }
    },
    reactions : [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            },
            emoji: {
                type: String,
                required: true
            }
        }
    ],
    isEdited : {
        type: Boolean,
        default: false
    },
    isDeleted : {
        type: Boolean,
        default: false
    }
}, {timestamps : true})

const Message = new mongoose.model("Message", messageModel)

export default Message;    
import mongoose from "mongoose";

const messageModel = new mongoose.Schema({
    senderId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    receiverId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    content : {
        type: String,
        required: true
    }
}, {timestamps : true})

const Message = new mongoose.model("Message", messageModel)

export default Message;    
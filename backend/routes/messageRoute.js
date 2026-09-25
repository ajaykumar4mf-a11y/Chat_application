import express from "express";
import {
    sendMessage,
    getMessages,
    markMessagesSeen,
    reactToMessage,
    editMessage,
    deleteMessage
} from "../controllers/messageController.js";
import authUser from "../middleware/authUser.js";

const router = express.Router();

router.post("/send/:id", authUser, sendMessage);
router.get("/:id", authUser, getMessages);
router.post("/seen/:id", authUser, markMessagesSeen);
router.put("/react/:id", authUser, reactToMessage);
router.put("/edit/:id", authUser, editMessage);
router.delete("/delete/:id", authUser, deleteMessage);

export default router;  
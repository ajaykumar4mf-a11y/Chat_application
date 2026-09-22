import express from "express";
import { sendMessage } from "../controllers/messageController.js";
import authUser from "../middleware/authUser.js";

const router = express.Router();

router.post("/send/:id", authUser, sendMessage);

export default router;  
import express from "express";
import { register , login, logout, getOtherUsers } from "../controllers/userController.js";
import authUser from "../middleware/authUser.js";        

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/", authUser, getOtherUsers); 

export default router;
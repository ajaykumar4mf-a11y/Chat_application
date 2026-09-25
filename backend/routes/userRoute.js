import express from "express";
import { register, login, logout, getOtherUsers, updateProfile } from "../controllers/userController.js";
import authUser from "../middleware/authUser.js";        

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/", authUser, getOtherUsers); 
router.put("/profile", authUser, updateProfile);
router.put("/update-photo", authUser, updateProfile);

export default router;
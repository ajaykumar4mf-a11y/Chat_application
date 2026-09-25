import bcrypt from "bcryptjs";
import userModel from "../models/userModel.js";
import messageModel from "../models/messageModel.js";
import jwt from "jsonwebtoken";
import { io } from "../socket/socket.js";
import cloudinary from "../config/cloudinary.js";

const register = async (req, res) => {
    try {
        const { fullName, fullname, userName, username, password, confirmPassword, gender } = req.body;
        const name = fullName || fullname;
        const userIdentifier = userName || username;
        const normalizedGender = gender ? gender.toLowerCase() : "";

        if (!name || !userIdentifier || !password || !gender) {
            return res.status(400).json({ error: "All fields are required" });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ error: "Password does not match" });
        }

        // Enforce strong password: >=8 chars, uppercase, lowercase, number, special char
        const minLength = password.length >= 8;
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=\\/\[\]]/.test(password);

        if (!minLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
            return res.status(400).json({
                error: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character."
            });
        }

        const user = await userModel.findOne({ userName: userIdentifier });
        if (user) {
            return res.status(400).json({ error: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const isFemale = normalizedGender === "female";
        const profilePhoto = isFemale
            ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${userIdentifier}&top=bob,bun,curly,curvy,longButNotTooLong,miaWallace,straight01,straight02,straightAndStrand&facialHairProbability=0`
            : `https://api.dicebear.com/7.x/avataaars/svg?seed=${userIdentifier}&top=shortFlat,shortRound,shortWaved,theCaesar,theCaesarAndSidePart,shavedSides&facialHair=beardLight,beardMedium,moustacheMagnum&facialHairProbability=60`;

        await userModel.create({
            fullName: name,
            userName: userIdentifier,
            password: hashedPassword,
            gender: normalizedGender,
            profilePhoto
        });
        return res.status(201).json({ message: "Account created successfully", success: true });

    } catch (error) {
        console.log("Register error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}

const login = async (req, res) => {
    try {
        const { userName, username, password } = req.body;
        const userIdentifier = userName || username;
        if (!userIdentifier || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }
        const user = await userModel.findOne({ userName: userIdentifier });
        if (!user) {
            return res.status(400).json({ error: "User not found" });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                error: "Invalid password",
            });
        }
        const token = jwt.sign(
            { user: user._id },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "1d" }
        );

        res.cookie("token", token, {
            maxAge: 1 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            secure: process.env.NODE_ENV === "production"
        });
        return res.status(200).json({
            message: "Login successful",
            success: true,
            user
        });

    } catch (error) {
        console.log("Login error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}

const logout = async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            secure: process.env.NODE_ENV === "production"
        });
        return res.status(200).json({
            message: "Logout successful",
            success: true
        });
    } catch (error) {
        console.log("Logout error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}

const getOtherUsers = async (req, res) => {
    try {
        const loggedInUserId = req.user?._id || req.user;
        const users = await userModel.find({ _id: { $ne: loggedInUserId } }).select("-password").lean();
        if (!users) {
            return res.status(404).json({ error: "No users found" });
        }

        // Fetch unread count and last message for each contact relative to loggedInUserId
        const usersWithDetails = await Promise.all(
            users.map(async (user) => {
                const unreadCount = await messageModel.countDocuments({
                    senderId: user._id,
                    receiverId: loggedInUserId,
                    seen: { $ne: true }
                });

                const lastMessage = await messageModel.findOne({
                    $or: [
                        { senderId: loggedInUserId, receiverId: user._id },
                        { senderId: user._id, receiverId: loggedInUserId }
                    ]
                }).sort({ createdAt: -1 }).lean();

                return {
                    ...user,
                    unreadCount: unreadCount || 0,
                    lastMessage: lastMessage ? {
                        _id: lastMessage._id,
                        content: lastMessage.isDeleted ? "This message was deleted" : lastMessage.content,
                        senderId: lastMessage.senderId,
                        receiverId: lastMessage.receiverId,
                        seen: lastMessage.seen,
                        delivered: lastMessage.delivered || lastMessage.seen || false,
                        isDeleted: Boolean(lastMessage.isDeleted),
                        createdAt: lastMessage.createdAt
                    } : null
                };
            })
        );

        return res.status(200).json({
            message: "Other users fetched successfully",
            success: true,
            users: usersWithDetails
        });
    } catch (error) {
        console.log("Get other users error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}


const updateProfile = async (req, res) => {
    try {
        const loggedInUserId = req.user?._id || req.user;
        const { fullName, profilePhoto, gender } = req.body;

        if (!loggedInUserId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const user = await userModel.findById(loggedInUserId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (fullName && fullName.trim()) {
            user.fullName = fullName.trim();
        }

        if (gender) {
            const normalizedGender = gender.toLowerCase();
            if (["male", "female", "other"].includes(normalizedGender)) {
                user.gender = normalizedGender;
            }
        }

        if (profilePhoto) {
            if (profilePhoto.startsWith("data:image/")) {
                try {
                    const uploadResponse = await cloudinary.uploader.upload(profilePhoto);
                    user.profilePhoto = uploadResponse.secure_url;
                } catch (cloudErr) {
                    console.error("Cloudinary upload error:", cloudErr.message);
                    user.profilePhoto = profilePhoto;
                }
            } else {
                user.profilePhoto = profilePhoto;
            }
        }

        await user.save();

        const userResponse = await userModel.findById(loggedInUserId).select("-password");

        // Broadcast profile change to all connected clients so real-time chat updates instantly
        io.emit("userUpdated", userResponse);

        return res.status(200).json({
            message: "Profile updated successfully",
            success: true,
            user: userResponse
        });
    } catch (error) {
        console.log("Update profile error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
};

export { register, login, logout, getOtherUsers, updateProfile };
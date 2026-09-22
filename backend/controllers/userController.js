import bcrypt from "bcryptjs";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";

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
        const user = await userModel.findOne({ userName: userIdentifier });
        if (user) {
            return res.status(400).json({ error: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        // generate picture using randomuser.me
        const profilePhoto = normalizedGender === "male" 
            ? `https://avatar.iran.liara.run/public/boy?username=${userIdentifier}` 
            : `https://avatar.iran.liara.run/public/girl?username=${userIdentifier}`;

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
            sameSite: "strict",
            secure: process.env.NODE_ENV !== "development"
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
        res.clearCookie("token");
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
        const users = await userModel.find({ _id: { $ne: loggedInUserId  } }).select("-password");
        if (!users) {
            return res.status(404).json({ error: "No users found" });
        }
        return res.status(200).json({
            message: "Other users fetched successfully",
            success: true,
            users
        });
    } catch (error) {
        console.log("Get other users error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}


export { register, login, logout, getOtherUsers };
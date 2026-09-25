import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
    try {
        const MONGO_URI = process.env.MONGODB_URI;
        
        if (!MONGO_URI) {
            throw new Error("Please provide MongoDB URI in environment variables");
        }

        if (mongoose.connection.readyState === 1) {
            console.log("MongoDB is already connected");
            return;
        }

        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 8000,
        });
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
    }
};

export default connectDB;

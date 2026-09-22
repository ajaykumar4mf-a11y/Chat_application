import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const MONGO_URI = process.env.MONGODB_URI;
        
        if(!MONGO_URI) {
            throw new Error("Please provide MongoDB URI");
        }

        await mongoose.connect(MONGO_URI);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.log(error);
        
    }
};

export default connectDB;

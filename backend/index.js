import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./config/database.js";
import userRouter from "./routes/userRoute.js";
import messageRouter from "./routes/messageRoute.js";
    
dotenv.config();

const app = express();

const PORT = process.env.PORT || 8080;

// middleware
app.use(express.json());
app.use(cookieParser());

// routes
app.use("/api/user", userRouter);
app.use("/api/message", messageRouter);

app.listen(PORT, () => {
    connectDB();
    console.log(`Server is running on port ${PORT}`);
});
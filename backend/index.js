import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
import userRouter from "./routes/userRoute.js";
    
dotenv.config();

const app = express();

const PORT = process.env.PORT || 8080;

// middleware
app.use(express.json());

// routes
app.use("/api", userRouter);

app.listen(PORT, () => {
    connectDB();
    console.log(`Server is running on port ${PORT}`);
});
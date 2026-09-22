import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

const authUser = async(req, res, next) =>{
    try{
        const token = req.cookies.token;
        if(!token){
            return res.status(401).json({ error: "Unauthorized" });
        }
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.user = decodedToken.user;
        next();
    }catch(error){
        console.log("Authentication error:", error);
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}   

export default authUser;
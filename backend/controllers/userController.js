import bcrypt from "bcryptjs";
import userModel from "../models/userModel.js";

const register = async (req, res) => {
    try{
        const {fullname,username,password,confirmPassword,gender} = req.body;
        if(!fullname || !username || !password || !gender) {
            return res.status(400).json({error : "all field required"});
        }
        if(password !== confirmPassword){
            return res.status(400).json({error : "password does not match"});
        }
        const user = await userModel.findOne({username});
        if(user){
            return res.status(400).json({error : "user already exists"});
        }

        const hashedPassword = await bcrypt.hash(password,10);
        //generate picture using randomuser.me
        const profilePhoto = gender === "male" ? `https://avatar.iran.liara.run/public/boy?username=${username}` : `https://avatar.iran.liara.run/public/girl?username=${username}`;
        
        await userModel.create({fullname,username,password: hashedPassword,gender,profilePhoto});
        return res.status(201).json({message : "User created successfully"});   

    }catch(error){
        console.log(error);
    }
}
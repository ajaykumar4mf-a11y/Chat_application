import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        fullName : {
            type: String,
            required: true
        },  
        username : {
            type: String,
            required: true,
            unique: true
        },
        profilePhoto : {
            type: String,
            default: ""
        },
        password : {
            type: String,
            required: true
        },
        gender : {
            type: String,
            enum: ["male", "female", "other"],
            required: true
        },
        
    },
    {timestamps : true}
)

const userModel = new mongoose.model("User", userSchema)

export default userModel
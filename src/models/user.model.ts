import mongoose from "mongoose";
import { type User } from "../types/user.type.js";

const userSchema = new mongoose.Schema<User>({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true, 
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role:{ type: String, 
        enum: ['user', 'superadmin','admin','coordinator'],
        default: 'user' },
    organization: {
        type: String,
        required: false
    }

},{timestamps: true});

const Usermodel = mongoose.model('User', userSchema);
export default Usermodel;
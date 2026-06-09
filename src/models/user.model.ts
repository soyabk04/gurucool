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
    },
    otpverified: {
        type: Boolean,
        default: false,
    }

},{timestamps: true});

const otpSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    otp: {
        type: Number,
        required: true
    }
},{ expireAfterSeconds: 3600 });

const Otpmodel = mongoose.model('Otp', otpSchema);
const Usermodel = mongoose.model('User', userSchema);
export { Usermodel, Otpmodel };
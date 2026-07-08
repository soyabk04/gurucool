import mongoose from "mongoose";
import { type Otp, type User } from "../types/user.type.js";

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
    ID: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    groupId: {
        type: mongoose.Types.ObjectId,
        required: false,
        ref: 'group'
    },
    role: {
        type: String,
        enum: ['user', 'superadmin', 'admin', 'coordinator'],
        default: 'user'
    },
    organization: {
        type: mongoose.Types.ObjectId,
        required: false,
        ref: 'Organization'
    },
    otpverified: {
        type: Boolean,
        default: false,
    }

}, { timestamps: true });

const otpSchema = new mongoose.Schema<Otp>({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    otp: {
        type: Number,
        required: true
    }
}, { timestamps: true });
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });

const Otpmodel = mongoose.model('Otp', otpSchema);
const Usermodel = mongoose.model('User', userSchema);
export { Usermodel, Otpmodel };
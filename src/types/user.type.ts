import mongoose from "mongoose";

export interface User {
    name: string;
    email: string;
    ID:string;
    password: string;
    role: 'user' | 'superadmin' | 'admin' | 'coordinator';
    organization?: mongoose.Schema.Types.ObjectId;
    otpverified?:boolean;
}

export interface Otp {
    userId: mongoose.Types.ObjectId;
    otp: number;
}
export interface rolesrequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}
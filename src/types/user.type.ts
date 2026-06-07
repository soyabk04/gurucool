import mongoose from "mongoose";

export interface User {
    name: string;
    email: string;
    password: string;
    role: 'user' | 'superadmin' | 'admin' | 'coordinator';
    organization?: mongoose.Schema.Types.ObjectId;
}


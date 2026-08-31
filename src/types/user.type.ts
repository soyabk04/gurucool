import { Types } from "mongoose";
import { type Request } from "express";

export interface User {
    name: string;
    email: string;
    ID: string;
    password: string;
    role: "user" | "superadmin" | "admin" | "coordinator";

    organization?: Types.ObjectId;
    groupId?: Types.ObjectId;

    otpverified?: boolean;
}

export interface Otp {
    userId: Types.ObjectId;
    otp: number;
    attempts?: number;
}

// export interface RolesRequest extends Request {
//     user?: {
//         userId: string;
//         role: "user" | "superadmin" | "admin" | "coordinator";
//     };
// }
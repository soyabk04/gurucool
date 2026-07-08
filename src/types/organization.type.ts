import mongoose, { Types } from "mongoose";
import type { User } from "./user.type.js";

export interface orgPurchase{
    organizationId: Types.ObjectId;
    courseId: Types.ObjectId;
    purchaseDate: Date;
    amount: number;
}

export interface organization {
    name: string;
    domain: string;
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string;
    adminUserId?: Types.ObjectId;
    users?: User[];
    createdAt?: Date;
    updatedAt?: Date;
}
export interface group {
    name:string;
    organization:Types.ObjectId;
    groupCode:string;
    coordinator:Types.ObjectId;
    users?: User[];
}
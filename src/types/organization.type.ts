import mongoose from "mongoose";

export interface orgPurchase{
    organizationId: mongoose.Schema.Types.ObjectId;
    courseId: mongoose.Schema.Types.ObjectId;
    purchaseDate: Date;
    amount: number;
}

export interface organization {
    name: string;
    domain: string;
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string;
    adminUserId?: mongoose.Schema.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface group {
    name:string;
    organization:mongoose.Schema.Types.ObjectId;
    coordinator:mongoose.Schema.Types.ObjectId;
}
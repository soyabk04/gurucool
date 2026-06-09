import mongoose from "mongoose";
import {Otpmodel} from "../models/user.model.js";

function generateOTP(userId: any):unknown {
    const otp =Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
    const otpEntry = new Otpmodel({ userId, otp });
    otpEntry.save();
    return otp;
}
export {generateOTP};
import { randomInt } from "crypto";
import {sendmail} from "./sendemail.js";
import {Otpmodel,Usermodel} from "../models/user.model.js";


async function generateOTP(userId: any) {
    const otp = randomInt(100000, 1000000); // cryptographically secure 6-digit OTP
    let user=await Usermodel.findById(userId);
    if(!user){
        throw new Error("User not found");
    }
    // Remove any previous outstanding OTPs for this user so only the
    // latest one is valid and attempt-count tracking stays accurate.
    await Otpmodel.deleteMany({ userId });
    await sendmail("Your OTP for account verification", `Your OTP is: ${otp}`, user.email);
    const otpEntry = new Otpmodel({ userId, otp });
    await otpEntry.save();
    return {message:`OTP sent to ${user.email}`};
}
export {generateOTP};
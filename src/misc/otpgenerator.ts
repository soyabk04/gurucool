import {sendmail} from "./sendemail.js";
import {Otpmodel,Usermodel} from "../models/user.model.js";


async function generateOTP(userId: any) {
    const otp =Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
    let user=await Usermodel.findById(userId);
    if(!user){
        throw new Error("User not found");
    }
    await sendmail("Your OTP for account verification", `Your OTP is: ${otp}`, user.email);
    const otpEntry = new Otpmodel({ userId, otp });
    await otpEntry.save();
    return otp;
}
export {generateOTP};
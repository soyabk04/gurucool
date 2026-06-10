import {Otpmodel, Usermodel } from "../models/user.model.js";
import {comparepass, hashpass}  from "../misc/passwordhash.js";
import {generateOTP} from "../misc/otpgenerator.js";
import mongoose from "mongoose";

export const createUser = async (userData: any) => {
  try {
    if(await Usermodel.findOne({ email: userData.email })) {
        throw new Error("Email already exists");
    }
    let hashedPassword = await hashpass(userData.password);
    userData.password = hashedPassword;
    const user = new Usermodel(userData);
    await user.save();
    const otp = await generateOTP(user._id);
    return otp;
  } catch (error: any) {
    throw new Error(`Error creating user: ${error.message}`);
  }
}
export const userlogin = async (email: string, password: string) => {
  try{
    const user=await Usermodel.findOne({email:email});
    if(!user){
        throw new Error("User not found");
    }
    const isMatch=await comparepass(password,user.password);
    if(!isMatch){
        throw new Error("Invalid password");
    }
    return {message:"Login successful", user:user};

  }catch(error:any){
    throw new Error(`Error logging in: ${error.message}`);
  }
}

export const verifyUser = async (userId: string, otp: string) => {
  try {

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    const user = await Usermodel.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    const otpDoc = await Otpmodel.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      otp: Number(otp),
    });

    if (!otpDoc) {
      throw new Error("Invalid OTP");
    }

    user.otpverified = true;
    await user.save();

    await Otpmodel.deleteOne({ _id: otpDoc._id });

    return {
      message: "User verified successfully",
      user,
    };
  } catch (error: any) {
    throw new Error(`Error verifying user: ${error.message}`);
  }
};
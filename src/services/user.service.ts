import {Usermodel } from "../models/user.model.js";
import {comparepass, hashpass}  from "../misc/passwordhash.js";
import {generateOTP} from "../misc/otpgenerator.js";

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
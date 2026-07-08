import { Otpmodel, Usermodel } from "../models/user.model.js";
import { comparepass, hashpass } from "../misc/passwordhash.js";
import { generateOTP } from "../misc/otpgenerator.js";
import mongoose from "mongoose";
import { generatePassword } from "../misc/passwordGenerator.js";
import { sendWelcomeEmail } from "../misc/sendemail.js";
import  jwt  from "jsonwebtoken"; 
import { Groupmodel } from "../models/organization.model.js";
import { ATJWTKEY } from "../config/env.config.js";


export const createUser = async (users: any[], userInfo: any, failedUsers: any[]) => {
  try {
    const createdUsers = [];
    const failedUser = failedUsers;
    
    for (const userData of users) {
      try {

        if (userInfo.role === "admin" && userData.role === "superadmin" || userInfo.role === "coordinator" && (userData.role === "superadmin" || userData.role === "admin")
          || userInfo.role === "user" && (userData.role === "superadmin" || userData.role === "admin" || userData.role === "coordinator")) {

          failedUser.push({
            user: userData,
            error: `${userInfo.role} cannot create ${userData.role} users`,
          });
          continue;
        }

        const existingUser = await Usermodel.findOne({
          email: userData.email,
        });

        if (existingUser) {
          failedUser.push({
            user: userData,
            error: "Email already exists",
          });
          continue;
        }
        if (!userData.password) {
          userData.password = generatePassword();
        }
        let pass=userData.password
        userData.password = await hashpass(
          pass
        );
        console.log(pass)
        let groupId=await Groupmodel.findOne({
          groupCode: userData.groupCode.toUpperCase(),
        });
        if (!groupId) {
          failedUser.push({
            user: userData,
            error: "Group not found",
          });
          continue;
        }
        userData.groupId = groupId._id;

        const newUser = new Usermodel({ ...userData, createdBy: userInfo.userId });
        await newUser.save();
        let organization = await Usermodel.findById(userInfo.userId)
          .populate("organization");
        if (!organization?.name) {
          throw new Error("Organization not found");
        }
        await sendWelcomeEmail(newUser, pass, organization.name)

        createdUsers.push(newUser);
      } catch (error: any) {
        failedUser.push({
          user: userData,
          error: error.message,
        });
      }
    }

    return {
      createdUsers,
      failedUsers: failedUser,
    };
  } catch (error: any) {
    throw new Error(
      `Error creating users: ${error.message}`
    );
  }
};
export const userlogin = async (email: string, password: string) => {
  try {
    const user = await Usermodel.findOne({ email: email });
    if (!user) {
      throw new Error("User not found");
    }
    const isMatch = await comparepass(password, user.password);
    if (!isMatch) {
      throw new Error("Invalid password");
    }
    return { message: "Login successful", user:user};

  } catch (error: any) {
    throw new Error(`Error logging in: ${error.message}`);
  }
}

export const getUsers = async (
  userInfo: {
    userId: string;
    role: string;
  },
  page = 1,
  limit = 10
) => {
  const skip = (page - 1) * limit;

  if (userInfo.role === "superadmin") {
    const [users, total] = await Promise.all([
      Usermodel.find()
        .select("-password")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Usermodel.countDocuments(),
    ]);

    return {
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  const currentUser = await Usermodel.findById(
    userInfo.userId,
    "organization groupId"
  );

  if (!currentUser) {
    throw new Error("User not found");
  }

  if (userInfo.role === "admin") {
    if (!currentUser.organization) {
      throw new Error("Organization not found");
    }

    const filter = { organization: currentUser.organization };

    const [users, total] = await Promise.all([
      Usermodel.find(filter)
        .select("-password")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Usermodel.countDocuments(filter),
    ]);

    return {
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  if (userInfo.role === "coordinator") {
    if (!currentUser.groupId) {
      throw new Error("Group not found");
    }

    const filter = { groupId: currentUser.groupId };

    const [users, total] = await Promise.all([
      Usermodel.find(filter)
        .select("-password")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Usermodel.countDocuments(filter),
    ]);

    return {
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  throw new Error("Unauthorized");
};

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

export const getUserRole = async (userId: string) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    const user = await Usermodel.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    return user.role;
  } catch (error: any) {
    throw new Error(`Error fetching user role: ${error.message}`);
  }
};
export const checkLogin = async (accesstoken:string)=>{
    try{
      const token =jwt.verify(accesstoken,ATJWTKEY) as { userId: string; role: string };
          if (token){
        return ({success:true,message:"user is logged in"})
      }
    }

    catch(error:any){
      throw new Error(`Error logging in: ${error.message}`);
    }
}
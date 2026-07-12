import { Otpmodel, Usermodel } from "../models/user.model.js";
import { comparepass, hashpass } from "../utils/passwordhash.js";
import { generateOTP } from "../utils/otpgenerator.js";
import mongoose from "mongoose";
import { generatePassword } from "../utils/passwordGenerator.js";
import { sendWelcomeEmail } from "../utils/sendemail.js";
import jwt from "jsonwebtoken";
import { Groupmodel } from "../models/organization.model.js";
import { ATJWTKEY } from "../config/env.config.js";
import { ErrorCode } from "../errors/ErrorCode.js";
import { AppError } from "../errors/AppError.js";
import { emailQueue } from "../queue/email.queue.js";



export const createUser = async (
  users: any[],
  userInfo: any,
  failedItems: any[]
) => {
  const createdUsers = [];
  const failedUsers = failedItems;

  const organization = await Usermodel.findById(userInfo.userId).populate(
    "organization"
  );

  if (!organization?.organization) {
    throw new AppError(
      "Organization not found",
      404,
      "ORGANIZATION_NOT_FOUND"
    );
  }

  const orgName = organization.name;
  console.log(orgName)

  for (const userData of users) {
    try {
      // Role validation
      if (
        (userInfo.role === "admin" && userData.role === "superadmin") ||
        (userInfo.role === "coordinator" &&
          ["superadmin", "admin"].includes(userData.role)) ||
        (userInfo.role === "user" &&
          ["superadmin", "admin", "coordinator"].includes(userData.role))
      ) {
        failedUsers.push({
          user: userData,
          error: `${userInfo.role} cannot create ${userData.role} users`,
        });
        continue;
      }

      // Duplicate email
      const existingUser = await Usermodel.findOne({
        email: userData.email,
      });

      if (existingUser) {
        failedUsers.push({
          user: userData,
          error: "Email already exists",
        });
        continue;
      }

      // Password
      const plainPassword = userData.password || generatePassword();
      userData.password = await hashpass(plainPassword);

      // Group
      const group = await Groupmodel.findOne({
        groupCode: userData.groupCode.toUpperCase(),
      });

      if (!group) {
        failedUsers.push({
          user: userData,
          error: "Group not found",
        });
        continue;
      }

      userData.groupId = group._id;

      const newUser = new Usermodel({
        ...userData,
        createdBy: userInfo.userId,
      });

      await newUser.save();

      await emailQueue.add("welcome-email", {
        newUser,
        pass: plainPassword,
        orgName,
      });

      createdUsers.push(newUser);
    } catch (err) {
      failedUsers.push({
        user: userData,
        error:
          err instanceof Error ? err.message : "Unknown error occurred",
      });
    }
  }

  return {
    createdUsers,
    failedUsers,
  };
};

export const userlogin = async (
  email: string,
  password: string
) => {
  const user = await Usermodel.findOne({ email });

  if (!user) {
    throw new AppError(
      "User not found",
      404,
      ErrorCode.USER_NOT_FOUND
    );
  }

  const isMatch = await comparepass(password, user.password);

  if (!isMatch) {
    throw new AppError(
      "Invalid email or password",
      401,
      ErrorCode.INVALID_CREDENTIALS
    );
  }

  return {
    message: "Login successful",
    user,
  };
};

export const getUsers = async (
  userInfo: {
    userId: string;
    role: string;
  },
  page = 1,
  limit = 10
) => {
  const skip = (page - 1) * limit;

  // Validate pagination
  if (page < 1 || limit < 1) {
    throw new AppError(
      "Invalid pagination parameters",
      400,
      "INVALID_PAGINATION"
    );
  }

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
    throw new AppError(
      "User not found",
      404,
      "USER_NOT_FOUND"
    );
  }

  if (userInfo.role === "admin") {
    if (!currentUser.organization) {
      throw new AppError(
        "Organization not found",
        404,
        "ORGANIZATION_NOT_FOUND"
      );
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
      throw new AppError(
        "Group not found",
        404,
        "GROUP_NOT_FOUND"
      );
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

  // Invalid role
  throw new AppError(
    "You are not authorized to view users",
    403,
    "FORBIDDEN"
  );
};

export const verifyUser = async (userId: string, otp: string) => {

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

};





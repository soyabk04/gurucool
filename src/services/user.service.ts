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

  // `organization` here is the *creating user's* document (populated with
  // their organization). `organization.name` is that user's own name field,
  // not the organization's name — the org's name lives on the populated
  // `organization.organization` sub-document.
  const orgName = (organization.organization as any).name;

  for (const userData of users) {
    try {
      userData.organization=organization.organization._id;
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
        user:newUser,
        password: plainPassword,
        orgName,
      });

      // Send the OTP required to verify this account before first login.
      // await generateOTP(newUser._id);

      // Never return the password hash to the client.
      const safeUser = newUser.toObject();
      delete (safeUser as any).password;
      createdUsers.push(safeUser);
    } catch (err) {
      // Strip any hashed password that may already have been set on
      // userData before this record failed, so it never leaks in the
      // API response either.
      const { password: _omit, ...safeUserData } = userData;
      failedUsers.push({
        user: safeUserData,
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

  // if (!user.otpverified) {
  //   throw new AppError(
  //     "Account not verified. Please verify the OTP sent to your email before logging in.",
  //     403,
  //     "OTP_NOT_VERIFIED"
  //   );
  // }

  const safeUser = user.toObject();
  delete (safeUser as any).password;

  return {
    message: "Login successful",
    user: safeUser,
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

  const MAX_OTP_ATTEMPTS = 5;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user ID", 400, "INVALID_USER_ID");
  }

  const user = await Usermodel.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404, ErrorCode.USER_NOT_FOUND);
  }

  // Look up whatever outstanding OTP exists for this user (there should be
  // at most one, since generateOTP clears previous ones) so we can track
  // and cap failed attempts regardless of the code the caller submitted.
  const pendingOtp = await Otpmodel.findOne({
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (!pendingOtp) {
    throw new AppError("Invalid or expired OTP", 401, "INVALID_OTP");
  }

  if ((pendingOtp.attempts ?? 0) >= MAX_OTP_ATTEMPTS) {
    await Otpmodel.deleteOne({ _id: pendingOtp._id });
    throw new AppError(
      "Too many incorrect attempts. Please request a new OTP.",
      429,
      "OTP_LOCKED"
    );
  }

  if (pendingOtp.otp !== Number(otp)) {
    pendingOtp.attempts = (pendingOtp.attempts ?? 0) + 1;
    await pendingOtp.save();
    throw new AppError("Invalid or expired OTP", 401, "INVALID_OTP");
  }

  user.otpverified = true;
  await user.save();

  await Otpmodel.deleteOne({ _id: pendingOtp._id });

  const safeUser = user.toObject();
  delete (safeUser as any).password;

  return {
    message: "User verified successfully",
    user: safeUser,
  };

};

export const checkLogin=(accesstoken:string)=>{

     try {
       jwt.verify(accesstoken,ATJWTKEY);
     } catch {
      throw new AppError(
      "Invalid token",
      401,
      "INVALID_ACCESSTOKEN"
    );
     }
    return {success:true,message:"valid token"}
}





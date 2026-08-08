import { Otpmodel, Usermodel } from "../models/user.model.js";
import { comparepass, hashpass } from "../utils/passwordhash.js";
import { generateOTP } from "../utils/otpgenerator.js";
import mongoose from "mongoose";
import { generatePassword } from "../utils/passwordGenerator.js";
import { sendForgetPasswordEmail, sendWelcomeEmail } from "../utils/sendemail.js";
import jwt from "jsonwebtoken";
import { Groupmodel, Organizationmodel } from "../models/organization.model.js";
import { ATJWTKEY } from "../config/env.config.js";
import { ErrorCode } from "../errors/ErrorCode.js";
import { AppError } from "../errors/AppError.js";
import { emailQueue } from "../queue/email.queue.js";
import { organization } from "../types/organization.type.js";
import { User } from "../types/user.type.js";
import { userInfo } from "node:os";
import bcrypt from "bcrypt";



export const createUser = async (
  users: any[],
  userInfo: any,
  failedItems: any[] = []
) => {
  const createdUsers = [];
  const failedUsers = failedItems;

  let creatorOrgId: mongoose.Types.ObjectId | null = null;
  let orgName = "";

  if (userInfo.role === "superadmin") {
    // Superadmin must set organization on each user payload (validated by Zod).
  } else {
    const creator = await Usermodel.findById(userInfo.userId).populate(
      "organization"
    );

    if (!creator?.organization) {
      throw new AppError(
        "Organization not found",
        404,
        "ORGANIZATION_NOT_FOUND"
      );
    }

    creatorOrgId = creator.organization._id as mongoose.Types.ObjectId;
    const orgName = (creator.organization as unknown as organization | null)?.name;
  }

  for (const userData of users) {
    try {
      const targetOrgId =
        userInfo.role === "superadmin"
          ? userData.organization
          : creatorOrgId;

      if (!targetOrgId) {
        failedUsers.push({
          user: userData,
          error: "organization is required",
        });
        continue;
      }

      if (userInfo.role === "superadmin" && userData.organization) {
        const orgDoc = await Organizationmodel.findById(userData.organization);
        if (!orgDoc) {
          failedUsers.push({
            user: userData,
            error: "Organization not found",
          });
          continue;
        }
        orgName = orgDoc.name;
      }

      userData.organization = targetOrgId;
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
      if (!userData.groupCode) {
        failedUsers.push({
          user: userData,
          error: "groupCode is required",
        });
        continue;
      }

      const group = await Groupmodel.findOne({
        groupCode: userData.groupCode.toUpperCase(),
        organization: targetOrgId,
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
      const organization = await Organizationmodel.findById(targetOrgId);
      await emailQueue.add("welcome-email", {
        user: newUser,
        password: plainPassword,
        organization,
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
      "Invalid email or password",
      401,
      ErrorCode.INVALID_CREDENTIALS
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
  limit = 10,
  organizationId?: string
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
    if (organizationId) {
      const filter = { organization: organizationId };

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

export const checkLogin = (accesstoken: string) => {

  try {
    jwt.verify(accesstoken, ATJWTKEY);
  } catch {
    throw new AppError(
      "Invalid token",
      401,
      "INVALID_ACCESSTOKEN"
    );
  }
  return { success: true, message: "valid token" }
}

export const forgetPasswordLink = async (email: string) => {

  const user = await Usermodel.findOne({ email })
    .populate<{ organization: organization }>("organization").lean();


  if (!user) {
    throw new AppError(
      "User not found",
      404,
      ErrorCode.USER_NOT_FOUND
    );
  }

  const resetToken = jwt.sign(
    { userId: user._id },
    ATJWTKEY,
    { expiresIn: "1h" }
  );
  if (!user.organization) {
    throw new AppError(
      "Organization not found for the user",
      404,
      "ORGANIZATION_NOT_FOUND"
    );
  }
  const domain = user.organization.domain;
  if (!user.organization.domain) {
    throw new AppError(
      "Organization domain not found",
      404,
      "ORGANIZATION_DOMAIN_NOT_FOUND"
    );
  }

  const resetLink = `https://${user.organization.domain}/change-password?token=${resetToken}`;
  await sendForgetPasswordEmail( user, resetLink );
  console.log(`Password reset link sent to ${user.email}: ${resetLink}`);
  return {
    message: "Password reset link has been sent to your email." // In a real application, you wouldn't return this in the response.
  };
}



export const changePassword = async (
  token: string,
  newpass: string
) => {
  if (!token) {
    throw new AppError(
      "Token not found",
      404,
      "TOKEN_NOT_FOUND"
    );
  }

  try {
    const decoded = jwt.verify(token, ATJWTKEY) as jwt.JwtPayload;

    if (!decoded.userId) {
      throw new AppError(
        "Invalid token",
        401,
        "INVALID_TOKEN"
      );
    }

    const user = await Usermodel.findById(decoded.userId);

    if (!user) {
      throw new AppError(
        "Invalid token",
        401,
        "INVALID_TOKEN"
      );
    }

    const hashedPassword = await hashpass(newpass);

    user.password = hashedPassword;

    await user.save();

    return {
      message: "Password changed successfully",
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(
        "Token expired",
        401,
        "TOKEN_EXPIRED"
      );
    }

    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError(
        "Invalid token",
        401,
        "INVALID_TOKEN"
      );
    }

    throw error;
  }
};



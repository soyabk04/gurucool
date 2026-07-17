import { createUser, getUsers,checkLogin } from "../services/user.service.js";
import { userlogin, verifyUser } from "../services/user.service.js";
import { NextFunction, type Request, type Response } from "express";
import { generateToken, generateAccessToken } from "../utils/jwtToken.js";
import { csvToArray } from "../utils/csvToArray.js";
import { AppError } from "../errors/AppError.js";
import jwt from "jsonwebtoken";
import { revokeToken } from "../utils/tokenStore.js";

// NOTE: these options are shared by every cookie we set *and* every cookie
// we clear. `res.clearCookie` only successfully clears a cookie when its
// name and attributes match what was used to set it — a mismatch here
// silently no-ops and leaves the user "logged in".
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

const createUserController = async (req: Request, res: Response) => {
  const userData = req.body.users;
  const userInfo = req.user;
  const failedUser = req.body.failedItems;
  const user = await createUser(userData, userInfo, failedUser);

  res.status(201).json({
    success: true,
    user,
  });
};

const getUsersController = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new AppError("User not found", 401, "UNAUTHORIZED");
  }

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const result = await getUsers(user, page, limit);

  res.status(200).json(result);
};

const userLoginController = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const result = await userlogin(email, password);

  const { accesstoken, refreshtoken } = generateToken({
    userId: result.user._id,
    role: result.user.role,
  });

  const user = {
    name: result.user.name,
    role: result.user.role,
  };

  return res
    .cookie("accesstoken", accesstoken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    })
    .cookie("refreshtoken", refreshtoken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })
    .status(200)
    .json({
      success: true,
      user,
    });
};

const generateAccessTokenController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const refreshToken = req.cookies.refreshtoken;
  if (!refreshToken) {
    return next(
      new AppError("Refresh token missing", 401, "REFRESH_TOKEN_MISSING")
    );
  }

  const token = await generateAccessToken(refreshToken);
  if (!token) {
    return next(
      new AppError("Invalid or expired refresh token", 401, "INVALID_REFRESH_TOKEN")
    );
  }

  return res
    .status(200)
    .cookie("accesstoken", token, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    })
    .json({ success: true });
};

const otpVerificationController = async (req: Request, res: Response) => {
  const { userId, otp } = req.body;
  const result = await verifyUser(userId, otp);
  res.status(200).json(result);
};

const logoutUser = async (req: Request, res: Response) => {
  // Revoke the refresh token server-side so it can't be exchanged for a
  // new access token even after the cookie is cleared client-side.
  const refreshToken = req.cookies?.refreshtoken;
  if (refreshToken) {
    try {
      const decoded = jwt.decode(refreshToken) as
        | { jti?: string; exp?: number }
        | null;
      if (decoded?.jti && decoded.exp) {
        const ttlSeconds = decoded.exp - Math.floor(Date.now() / 1000);
        await revokeToken(decoded.jti, ttlSeconds);
      }
    } catch {
      // Malformed token — nothing to revoke, just proceed with clearing cookies.
    }
  }

  res.clearCookie("accesstoken", cookieOptions);
  res.clearCookie("refreshtoken", cookieOptions);

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

export const bulkUploadUsers = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "CSV file is required",
    });
  }

  const users = await csvToArray(req.file.buffer);

  res.json({
    success: true,
    data: users,
  });
};

const checkLoginController = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const accessToken = req.cookies.accesstoken;

    if (!accessToken) {
      throw new AppError(
        "Access token missing",
        401,
        "ACCESS_TOKEN_MISSING"
      );
    }

    checkLogin(accessToken);

    return res.status(200).json({
      success: true,
      message: "User is logged in",
    });
  } catch (err) {
    next(err);
  }
};

export {
  createUserController, userLoginController, generateAccessTokenController,
  otpVerificationController, getUsersController, logoutUser,checkLoginController
};

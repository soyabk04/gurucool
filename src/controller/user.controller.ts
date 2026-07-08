import { checkLogin, createUser, getUsers } from "../services/user.service.js";
import { userlogin, verifyUser } from "../services/user.service.js";
import { type Request, type Response } from "express";
import { generateToken, generateAccessToken } from "../misc/jwtToken.js";
import { AppError } from "../errors/AppError.js";
import jwt from "jsonwebtoken";
import { ATJWTKEY } from "../config/env.config.js";

const createUserController = async (req: Request, res: Response) => {
 
    const userData = req.body.users;
    const userInfo = req.user;
    const failedUser = req.body.failedItems;
    const user = await createUser(userData, userInfo, failedUser);

    res.status(201).json({
      success: true,
      user
    });
  } 
;


const getUsersController = async (req: Request, res: Response) => {
  
    const user = req.user;
    if (!user) {
      throw new Error("User not Found");
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await getUsers(user, page, limit);

    res.status(200).json(result);
  } ;

const userLoginController = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await userlogin(email, password);
    const { accessToken, refreshToken } = generateToken({ userId: result.user._id, role: result.user.role });
    const user = {
      name: result.user.name,
      role: result.user.role
    }
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,      // HTTPS only
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })
    return res.status(200).json({ success: true, accessToken, user })
      ;;
  
};

const generateAccessTokenController = async (req: Request, res: Response) => {
  let refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token provided" });
  }
  let token = generateAccessToken(refreshToken);
  if (!token) {
    return res.status(403).json({ message: "Invalid refresh token" });
  }
  return res.status(200).json({ success: true, accessToken: token });
}

const otpVerificationController = async (req: Request, res: Response) => {
  try {

    const { userId, otp } = req.body;
    // console.log(otp)
    const result = await verifyUser(userId, otp);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: `${error.message}` });
  }
}
const logoutUser = async (req: Request, res: Response) => {

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });

};

export {
  createUserController, userLoginController, generateAccessTokenController,
  otpVerificationController, getUsersController, logoutUser
};
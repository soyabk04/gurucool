import { checkLogin, createUser, getUsers } from "../services/user.service.js";
import { userlogin, verifyUser } from "../services/user.service.js";
import { type Request, type Response } from "express";
import { generateToken, generateAccessToken } from "../misc/jwtToken.js";
import jwt from "jsonwebtoken";
import { ATJWTKEY } from "../config/env.config.js";

const createUserController = async (req: Request, res: Response) => {
  try {
    const userData = req.body.validUsers;
    const userInfo = req.user;
    const failedUser = req.body.failedUser;
    const user = await createUser(userData, userInfo, failedUser);

    res.status(201).json({
      success: true,
      user
    });
  } catch (error: any) {
    res.status(500).json({ message: `${error.message}` });
  }
};
// const getUsersController = async (req: Request, res: Response) => {
//   try {
//     const token = req.headers.accesstoken;
//     if (!token || Array.isArray(token)) {
//       throw new Error("Invalid token");
//     }

//     const userdata = jwt.verify(token, ATJWTKEY) as {
//       userId: string;
//       role: "user" | "admin" | "superadmin" | "coordinator";
//     }
//     const userInfo = {
//       role: userdata.role,
//       userId: userdata.userId

//     }

//     const users = await getUsers(userInfo);

//     res.status(201).json({
//       success: true
//       , users
//     });
//   } catch (error: any) {
//     res.status(500).json({ message: `${error.message}` });
//   }
// };

const getUsersController = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      throw new Error("User not Found");
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await getUsers(user, page, limit);

    res.status(200).json(result);
  } catch (error:any) {
       throw new Error(`error :${error.message}`)
  }

};

const userLoginController = async (req: Request, res: Response) => {
  try {
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
  } catch (error: any) {
    res.status(500).json({ message: `${error.message}` });
  }
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
  try {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error: any) {
    throw new Error(`Error logging out: ${error.message}`);
  }
};
const checkLoginController = (req: Request, res: Response) => {
  try {
    const accesstoken = req.headers.authorization?.split(" ")[1];
    if (!accesstoken || Array.isArray(accesstoken)) {
      throw new Error("Invalid token");
    }
    const result = checkLogin(accesstoken)
    res.send({ result })
  } catch (error: any) {
    res.status(401).json({ message: `${error.message}` });
  }
}

export {
  createUserController, userLoginController, generateAccessTokenController,
  otpVerificationController, getUsersController, logoutUser, checkLoginController
};
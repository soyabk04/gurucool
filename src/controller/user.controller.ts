import { createUser, getUsers,checkLogin } from "../services/user.service.js";
import { userlogin, verifyUser } from "../services/user.service.js";
import { NextFunction, type Request, type Response } from "express";
import { generateToken, generateAccessToken } from "../utils/jwtToken.js";
import { csvToArray } from "../utils/csvToArray.js";
import { AppError } from "../errors/AppError.js";

  const cookieOptions = {
    httpOnly: true,
    secure: false,
    sameSite: "lax" as const,
  };
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

const generateAccessTokenController = async (req: Request, res: Response,next:NextFunction) => {
  let refreshToken = req.cookies.refreshtoken;
  if (!refreshToken) {
next()
  }
  let token = generateAccessToken(refreshToken);
  if (!token) {
    next()
  }
  return res.status(200).json({ success: true})
  .cookie("accesstoken", token, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
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



export const bulkUploadUsers = async (
  req: Request,
  res: Response
) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "CSV file is required",
    });
  }

  const users = await csvToArray(req.file.buffer);

  console.log(users);

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
import { createUser } from "../services/user.service.js";
import { userlogin ,verifyUser} from "../services/user.service.js";
import { type Request, type Response } from "express";
import {generateToken,generateAccessToken} from "../misc/jwtToken.js";
import {sendmail} from "../misc/sendemail.js";

 const createUserController = async (req: Request, res: Response) => {
  try {
    const userData = req.body;
    const user = await createUser(userData);

    res.status(201).json(user);
  } catch (error: any) {
    res.status(500).json({ message: `${error.message}` });
  }
};

const userLoginController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await userlogin(email, password);
    const {accessToken, refreshToken} = generateToken({ userId: result.user._id, role: result.user.role });
    res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,      // HTTPS only
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
})
    return res.status(200).json({accessToken})
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
  let token=generateAccessToken(refreshToken);
  if(!token){
    return res.status(403).json({ message: "Invalid refresh token" });
  }
  return res.status(200).json({ accessToken: token });
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

export { createUserController, userLoginController, generateAccessTokenController, otpVerificationController };
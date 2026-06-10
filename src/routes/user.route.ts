import { Router } from "express";
import  {createUserController,generateAccessTokenController,otpVerificationController,userLoginController}  from "../controller/user.controller.js";
import {userSigninValidator, userSignupValidator} from "../validator/users.validator.js";

const userRouter = Router();

userRouter.post("/", userSignupValidator, createUserController);
userRouter.post("/login", userSigninValidator, userLoginController);
userRouter.post("/accesstoken", generateAccessTokenController);
userRouter.post("/verify",otpVerificationController );

export default userRouter;

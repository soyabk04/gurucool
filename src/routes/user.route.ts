import { Router } from "express";
import  {createUserController,generateAccessTokenController,otpVerificationController,userLoginController,logoutUser}  from "../controller/user.controller.js";
import {userSigninValidator, userSignupValidator} from "../validator/users.validator.js";
import { authorizeRoles, isloggedIn, notloggedIn,authMiddleware } from "../middleware/auth.middleware.js";

const userRouter = Router();

userRouter.post("/createuser",authorizeRoles("superadmin", "admin","coordinator"), notloggedIn, userSignupValidator, createUserController);
userRouter.post("/login", notloggedIn, userSigninValidator, userLoginController);
userRouter.post("/accesstoken", isloggedIn, generateAccessTokenController);
userRouter.post("/verify",otpVerificationController );
userRouter.post("/logout", isloggedIn, logoutUser);
export default userRouter;

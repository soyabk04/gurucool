import { Router } from "express";
import  {createUserController,generateAccessTokenController,otpVerificationController,userLoginController,logoutUser, getUsersController,checkLoginController}  from "../controller/user.controller.js";
import {userSigninValidator, userSignupValidator} from "../validator/users.validator.js";
import { authorizeRoles, isloggedIn, notloggedIn,authMiddleware, authlogin } from "../middleware/auth.middleware.js";
import { type Request, type Response } from "express";
import { createsuperAdmin } from "../services/user.service.js";

const userRouter = Router();

userRouter.post("/createuser",authorizeRoles("superadmin", "admin","coordinator"), notloggedIn, userSignupValidator, createUserController);
userRouter.post("/login", notloggedIn, userSigninValidator, userLoginController);
userRouter.post("/accesstoken", isloggedIn, generateAccessTokenController);
userRouter.post("/admin", createsuperAdmin);
userRouter.post("/verify",otpVerificationController );
userRouter.get("/isloggedin", authlogin, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.body,
  });
});
userRouter.get("/",(req:Request,res:Response)=>{
       res.send({
        message:"welcome to guruCool"
        ,success:true
       })
})
userRouter.post("/logout", isloggedIn, logoutUser);

userRouter.get("/getusers",getUsersController);
export default userRouter;

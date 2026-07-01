import { Router } from "express";
import  {createUserController,generateAccessTokenController,otpVerificationController,userLoginController,logoutUser, getUsersController,checkLoginController}  from "../controller/user.controller.js";
import {userSigninValidator, userSignupValidator} from "../validator/users.validator.js";
import { authMiddleware,notLoggedIn } from "../middleware/authentication.middleware.js";
import { authorizeRoles } from "../middleware/Authorization.middleware.js";
import { type Request, type Response } from "express";
import { createsuperAdmin } from "../services/user.service.js";

const userRouter = Router();

userRouter.post("/createuser",authorizeRoles("superadmin", "admin","coordinator"), notLoggedIn, userSignupValidator, createUserController);
userRouter.post("/login", notLoggedIn, userSigninValidator, userLoginController);
userRouter.post("/accesstoken", authMiddleware, generateAccessTokenController);
userRouter.post("/admin", createsuperAdmin);
userRouter.post("/verify",otpVerificationController );
userRouter.get("/isloggedin", authMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});
userRouter.get("/",(req:Request,res:Response)=>{
       res.send({
        message:"welcome to guruCool"
        ,success:true
       })
})
userRouter.post("/logout", authMiddleware, logoutUser);

userRouter.get("/getusers",getUsersController);
export default userRouter;

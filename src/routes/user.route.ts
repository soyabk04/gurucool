import { Router } from "express";
import  {createUserController,generateAccessTokenController,otpVerificationController,userLoginController,logoutUser, getUsersController, checkLoginController}  from "../controller/user.controller.js";
import {userSigninValidator, userSignupValidator} from "../validator/users.validator.js";
import { authMiddleware,notLoggedIn } from "../middleware/authentication.middleware.js";
import { authorizeRoles } from "../middleware/Authorization.middleware.js";
import { type Request, type Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { bulkUploadUsers } from "../controller/user.controller.js";
import { upload, uploadCsv } from "../middleware/upload.middleware.js";
import { uploadFile } from "../controller/upload.controller.js";


const userRouter = Router();

userRouter.post("/createuser",authMiddleware,authorizeRoles("superadmin", "admin","coordinator"), userSignupValidator, asyncHandler(createUserController));
userRouter.post("/login", notLoggedIn, userSigninValidator, asyncHandler(userLoginController));
userRouter.post("/accesstoken", asyncHandler(generateAccessTokenController));
userRouter.post("/verify",asyncHandler(otpVerificationController) );
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
userRouter.post("/logout", authMiddleware, asyncHandler(logoutUser));

userRouter.post(
  "/csvparse",
  authMiddleware,authorizeRoles('superadmin','admin','coordinator'),
  uploadCsv.single("file"),
  asyncHandler(bulkUploadUsers)
);


userRouter.post(
  "/upload",
  authMiddleware,
  upload.single("file"),
  asyncHandler(uploadFile)
);

userRouter.get(
  "/getusers",
  authMiddleware, 
  asyncHandler(getUsersController)
);

userRouter.post('/checklogin',asyncHandler(checkLoginController))
export default userRouter;

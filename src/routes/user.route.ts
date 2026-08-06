import { Router } from "express";
import  {createUserController,
  generateAccessTokenController
  ,userLoginController,
  logoutUser, 
  getUsersController, 
  checkLoginController
}  from "../controller/user.controller.js";

import {
  userSigninValidator, 
  userSignupValidator
} from "../validator/users.validator.js";

import { 
  authMiddleware,
  notLoggedIn 
} from "../middleware/authentication.middleware.js";

import { 
  authorizeRoles 
} from "../middleware/Authorization.middleware.js";

import { 
  type Request,
   type Response 
  } from "express";

import { 
  asyncHandler 
} from "../middleware/asyncHandler.js";

import { 
  bulkUploadUsers
 } from "../controller/user.controller.js";

import {
   upload, 
   uploadCsv 
  } from "../middleware/upload.middleware.js";

import { 
  uploadFile 
} from "../controller/upload.controller.js";

import {
  createRateLimiter
 } from "../middleware/rateLimit.middleware.js"


const userRouter = Router();

userRouter.post(
  "/createuser",
  createRateLimiter(20, 15, "Too many user creation requests."),
  authMiddleware,
  authorizeRoles("superadmin", "admin", "coordinator"),
  userSignupValidator,
  asyncHandler(createUserController)
);

userRouter.post(
  "/login",
  createRateLimiter(5, 15, "Too many login attempts. Please try again later."),
  notLoggedIn,
  userSigninValidator,
  asyncHandler(userLoginController)
);

userRouter.post(
  "/accesstoken",
  createRateLimiter(30, 15, "Too many token refresh requests."),
  asyncHandler(generateAccessTokenController)
);

// userRouter.post("/verify",
//   createRateLimiter(5, 10),
//   asyncHandler(otpVerificationController)
// );

userRouter.get(
  "/isloggedin",
  createRateLimiter(100, 15),
  authMiddleware,
  (req, res) => {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  }
);

userRouter.get(
  "/",
  createRateLimiter(200, 15),
  (req: Request, res: Response) => {
    res.send({
      message: "welcome to guruCool",
      success: true,
    });
  }
);

userRouter.post(
  "/logout",
  createRateLimiter(20, 15),
  authMiddleware,
  asyncHandler(logoutUser)
);

userRouter.post(
  "/csvparse",
  createRateLimiter(5, 15, "Too many CSV uploads."),
  authMiddleware,
  uploadCsv.single("file"),
  asyncHandler(bulkUploadUsers)
);

userRouter.post(
  "/upload",
  createRateLimiter(20, 15, "Too many file uploads."),
  authMiddleware,
  upload.single("file"),
  asyncHandler(uploadFile)
);

userRouter.get(
  "/getusers",
  createRateLimiter(100, 15),
  authMiddleware,
  asyncHandler(getUsersController)
);

userRouter.post(
  "/checklogin",
  createRateLimiter(30, 15),
  asyncHandler(checkLoginController)
);

export default userRouter;

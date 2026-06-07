import { Router } from "express";
import  {createUserController,userLoginController}  from "../controller/user.controller.js";

const userRouter = Router();

userRouter.post("/", createUserController);
userRouter.post("/login", userLoginController);

export default userRouter;

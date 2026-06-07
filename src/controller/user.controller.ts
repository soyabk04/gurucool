import { createUser } from "../services/user.service.js";
import { userlogin } from "../services/user.service.js";
import { type Request, type Response } from "express";

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
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: `${error.message}` });
  }
};

export { createUserController, userLoginController };
import { type Request, type Response, type NextFunction } from "express";
import type { rolesrequest } from "../types/user.type.js";
import jwt from "jsonwebtoken";
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const token = authHeader.substring(7);
    // Here you would typically verify the token
    next();
};

const isloggedIn = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.acessToken;
    if (!authHeader) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    next();
}

const notloggedIn = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.acesstoken;

    if (authHeader) {
        return res.status(401).json({ message: "Already logged in" });
    }
    next();
}



const authorizeRoles = (...roles: string[]) => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const roletoken = req.headers.accesstoken;

    if (!roletoken || Array.isArray(roletoken)) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    try {
      const user = jwt.verify(
        roletoken,
        "secretKey"
      ) as {
        userId: string;
        role: string;
      };

      if (!roles.includes(user.role)) {
        return res.status(403).json({
          message: "Access denied",
        });
      }
        req.body.userInfo=user;
      next();
    } catch (error) {
      return res.status(401).json({
        message: "Invalid token",
      });
    }
  };
};

export { authMiddleware, isloggedIn, notloggedIn, authorizeRoles };

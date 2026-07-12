import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ATJWTKEY } from "../config/env.config.js";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authorization token missing",
    });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authorization token missing",
    });
  }

  try {
    const decoded = jwt.verify(token, ATJWTKEY) as { userId: string; role: string };
    req.user = decoded;
    

    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export const notLoggedIn = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  console.log("authHeader:", authHeader);
  if (!authHeader) {
    return next();
  }

  return res.status(400).json({
    success: false,
    message: "Already logged in",
  });
};
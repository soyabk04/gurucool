import { Request, Response } from "express";
import { R2Service } from "../utils/cloudflare.js";
import { AppError } from "../errors/AppError.js";

export const uploadFile = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
    });
  }
  const key = `uploads/${Date.now()}-${req.file.originalname}`;

  const response = await R2Service.upload(req.file, key);
  if (!response) {
    throw new AppError("Failed to upload file", 502, "UPLOAD_FAILED");
  }

  res.status(200).json({
    success: true,
    key,
  });
};
import { Request, Response } from "express";
import { R2Service } from "../utils/cloudflare.js";

export const uploadFile = async (req: Request, res: Response) => {
try{  
    if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
    });
  }
  const key = `uploads/${Date.now()}-${req.file.originalname}`;

  let response=await R2Service.upload(req.file, key);
  if (!response){
    console.log("error")
  }
  res.status(200).json({
    success: true,
    key,
  });}catch(error){
    res.send({
      error
    })
  }
};
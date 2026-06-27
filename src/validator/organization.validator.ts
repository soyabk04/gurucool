import {z} from "zod"
import type { Request,Response,NextFunction } from "express"
import mongoose from "mongoose"

const orgSchema = z.object({
  name: z.string().min(1, "Name is required"),
  domain: z.string().min(1, "Domain is required"),
  primaryColor: z.string().min(1, "Primary color is required"),
  secondaryColor: z.string().min(1, "Secondary color is required"),
  logoUrl: z.string().url("Invalid logo URL"),
});

export const organizationValidator = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const validationResult = orgSchema.safeParse(req.body);

  if (!validationResult.success) {
    const errorMessages = validationResult.error.issues.map(
      (issue) => issue.message
    );

    return res.status(400).json({
      success: false,
      errors: errorMessages,
      err:validationResult.error.issues

    });
  }

  req.body.validOrg = validationResult.data;

  next();
};
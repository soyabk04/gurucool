import {z} from "zod"
import type { Request,Response,NextFunction } from "express"
import mongoose from "mongoose"
import { validate } from "./courses.validator.js";
import {userSchema} from "./users.validator.js"

const objectIdSchema = z
    .string()
    .trim()
    .refine(
        (id) => mongoose.Types.ObjectId.isValid(id),
        { message: "Invalid ObjectId" }
    )
    .transform((id) => new mongoose.Types.ObjectId(id));

const orgSchema = z.object({
  name: z.string().min(1, "Name is required"),
  domain: z.string().min(1, "Domain is required"),
  primaryColor: z.string().min(1, "Primary color is required"),
  secondaryColor: z.string().min(1, "Secondary color is required"),
  logoUrl: z.string().url("Invalid logo URL").optional(),
  adminUserId: objectIdSchema.optional(),
  users:userSchema.array().optional()
});

const grpSchema=z.object({
  name:z.string().min(1),
  coordinator:objectIdSchema.optional(),
  users:userSchema.array().optional(),
  groupCode:z.string().min(1, "Group code is required")
})

const organizationValidator=validate(orgSchema,'organization')
const groupValidator=validate(grpSchema,'group')

export {organizationValidator,groupValidator}
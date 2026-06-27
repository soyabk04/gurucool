import { Router } from "express";
import { createOrganizationController } from "../controller/organization.controller.js";
import { organizationValidator } from "../validator/organization.validator.js";
import { authorizeRoles } from "../middleware/auth.middleware.js";

export const organizationRouter = Router();

organizationRouter.post("/",authorizeRoles("superadmin"),organizationValidator,createOrganizationController)
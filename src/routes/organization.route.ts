import { Router } from "express";
import { createOrganizationController ,createGroupController} from "../controller/organization.controller.js";
import { groupValidator, organizationValidator } from "../validator/organization.validator.js";
import { authorizeRoles } from "../middleware/auth.middleware.js";

export const organizationRouter = Router();

organizationRouter.post("/",authorizeRoles("superadmin"),organizationValidator,createOrganizationController);
organizationRouter.post("/group",authorizeRoles("superadmin","admin"),groupValidator,createGroupController);
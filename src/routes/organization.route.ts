import { Router } from "express";
import { createOrganizationController ,createGroupController} from "../controller/organization.controller.js";
import { groupValidator, organizationValidator } from "../validator/organization.validator.js";
import { authorizeRoles } from "../middleware/Authorization.middleware.js";
import { authMiddleware } from "../middleware/authentication.middleware.js";

export const organizationRouter = Router();

organizationRouter.post("/",authMiddleware,authorizeRoles("superadmin"),organizationValidator,createOrganizationController);
organizationRouter.post("/group",authMiddleware,authorizeRoles("superadmin","admin"),groupValidator,createGroupController);
organizationRouter.post("/")
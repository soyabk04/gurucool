import { Router } from "express";
import { createOrganizationController,createGroupController,getOrganizationUsersController,} from "../controller/organization.controller.js";
import {organizationValidator,groupValidator,} from "../validator/organization.validator.js";
import { authorizeRoles } from "../middleware/Authorization.middleware.js";
import { authMiddleware } from "../middleware/authentication.middleware.js";

export const organizationRouter = Router();

organizationRouter.post(
    "/",
    authMiddleware,
    authorizeRoles("superadmin"),
    organizationValidator,
    createOrganizationController
);
organizationRouter.get(
    "/",
    authMiddleware,
    authorizeRoles("superadmin", "admin", "coordinator"),
    getOrganizationUsersController
);

organizationRouter.post(
    "/group",
    authMiddleware,
    authorizeRoles("superadmin", "admin"),
    groupValidator,
    createGroupController
);

organizationRouter.get(
    "/group",
    authMiddleware,
    authorizeRoles("coordinator"),
    getOrganizationUsersController
);
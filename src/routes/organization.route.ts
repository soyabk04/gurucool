import { Router } from "express";
import { createOrganizationController,createGroupController,getOrganizationUsersController,} from "../controller/organization.controller.js";
import {organizationValidator,groupValidator,} from "../validator/organization.validator.js";
import { authorizeRoles } from "../middleware/Authorization.middleware.js";
import { authMiddleware } from "../middleware/authentication.middleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const organizationRouter = Router();

organizationRouter.post(
    "/",
    authMiddleware,
    authorizeRoles("superadmin"),
    organizationValidator,
    asyncHandler(createOrganizationController)
);
organizationRouter.get(
    "/",
    authMiddleware,
    authorizeRoles("superadmin", "admin", "coordinator"),
    asyncHandler(getOrganizationUsersController)
);

organizationRouter.post(
    "/group",
    authMiddleware,
    authorizeRoles("superadmin", "admin"),
    groupValidator,
    asyncHandler(createGroupController)
);

organizationRouter.get(
    "/group",
    authMiddleware,
    authorizeRoles("coordinator"),
    asyncHandler(getOrganizationUsersController)
);
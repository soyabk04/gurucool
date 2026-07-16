import { Router } from "express";
import { getGroupController,createOrganizationController,createGroupController,getOrganizationUsersController, getOrganizationController,} from "../controller/organization.controller.js";
import {organizationValidator,groupValidator,} from "../validator/organization.validator.js";
import { authorizeRoles } from "../middleware/Authorization.middleware.js";
import { authMiddleware } from "../middleware/authentication.middleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { upload } from "../middleware/upload.middleware.js";
import { getGroup } from "../services/organization.service.js";


export const organizationRouter = Router();

organizationRouter.post(
    "/",
    authMiddleware,
    authorizeRoles("superadmin"),
    upload.single("logo"),
    organizationValidator,
    asyncHandler(createOrganizationController)
);
organizationRouter.get("/org",
     authMiddleware,
    authorizeRoles("superadmin"),
    getOrganizationController
)
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
    authorizeRoles("coordinator","admin"),
    asyncHandler(getOrganizationUsersController)
);
organizationRouter.get(
    "/groups",
    authMiddleware,
    authorizeRoles("admin"),
    asyncHandler(getGroupController)
);
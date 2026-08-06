import {
     Router
     } from "express";

import { 
    getGroupController,
    createOrganizationController,
    getOrgThemeController
    ,createGroupController
    ,getOrganizationUsersController, 
    getOrganizationController,
    getOrganizationDetailsController,
} from "../controller/organization.controller.js";

import {
    organizationValidator,
    groupValidator,
} from "../validator/organization.validator.js";

import { 
    authorizeRoles
 } from "../middleware/Authorization.middleware.js";

import { 
    authMiddleware
 } from "../middleware/authentication.middleware.js";

import { 
    asyncHandler
 } from "../middleware/asyncHandler.js";

import {
     upload 
    } from "../middleware/upload.middleware.js";

import { 
    createRateLimiter
 } from "../middleware/rateLimit.middleware.js";


export const organizationRouter = Router();

organizationRouter.post(
    "/orgtheme",
    createRateLimiter(100, 15),
    asyncHandler(getOrgThemeController)
);

organizationRouter.post(
    "/",
    createRateLimiter(5, 15, "Too many organization creation requests."),
    authMiddleware,
    authorizeRoles("superadmin"),
    upload.single("logo"),
    organizationValidator,
    asyncHandler(createOrganizationController)
);
organizationRouter.get(
  "/details/:organizationId",
  
  getOrganizationDetailsController
);
organizationRouter.get(
    "/org",
    createRateLimiter(100, 15),
    authMiddleware,
    authorizeRoles("superadmin"),
    getOrganizationController
);

organizationRouter.get(
    "/",
    createRateLimiter(100, 15),
    authMiddleware,
    authorizeRoles("superadmin", "admin", "coordinator"),
    asyncHandler(getOrganizationUsersController)
);

organizationRouter.post(
    "/group",
    createRateLimiter(20, 15, "Too many group creation requests."),
    authMiddleware,
    authorizeRoles("superadmin", "admin"),
    groupValidator,
    asyncHandler(createGroupController)
);

organizationRouter.get(
    "/group",
    createRateLimiter(100, 15),
    authMiddleware,
    authorizeRoles("coordinator", "admin"),
    asyncHandler(getOrganizationUsersController)
);

organizationRouter.get(
    "/groups",
    createRateLimiter(100, 15),
    authMiddleware,
    authorizeRoles("admin"),
    asyncHandler(getGroupController)
);
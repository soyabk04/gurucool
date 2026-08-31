import { Router } from "express";
import { authMiddleware } from "../middleware/authentication.middleware.js";
import { authorizeRoles } from "../middleware/Authorization.middleware.js";
import {
   getAdminDashboard,
   getCoordinatorDashboard,
   getUserDashboard
} from "../controller/analytics.controller.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const analyticsRouter = Router();
analyticsRouter.get(
    "/admin/dashboard",
    authMiddleware,
    authorizeRoles("admin"),
    asyncHandler(getAdminDashboard)
);
analyticsRouter.get(
    "/coordinator/dashboard",
    authMiddleware,
    authorizeRoles("coordinator"),
    asyncHandler(getCoordinatorDashboard)
);

analyticsRouter.get(
    "/user/dashboard",
    authMiddleware,
    authorizeRoles("user"),
    asyncHandler(getUserDashboard)
);
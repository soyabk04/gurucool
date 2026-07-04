import { Router } from "express";
import { authMiddleware } from "../middleware/authentication.middleware.js";
import { authorizeRoles } from "../middleware/Authorization.middleware.js";
import {
    dashboardAnalyticsController,
    getCourseOverviewController
} from "../controller/analytics.controller.js";

export const analyticsRouter = Router();

analyticsRouter.get(
    "/dashboard",
    authMiddleware,
    authorizeRoles(
        "superadmin",
        "admin",
        "coordinator"
    ),
    dashboardAnalyticsController
);
analyticsRouter.get(
    "/course/:courseId",
    authMiddleware,
    authorizeRoles(
        "superadmin",
        "admin",
        "coordinator"
    ),
    getCourseOverviewController
);
import { Router } from "express";
import { authMiddleware } from "../middleware/authentication.middleware.js";
import { authorizeRoles } from "../middleware/Authorization.middleware.js";
import {
   getDashboard
} from "../controller/analytics.controller.js";

export const analyticsRouter = Router();
analyticsRouter.get(
    "/dashboard",
    authMiddleware,
    authorizeRoles("admin"),
    getDashboard
);
import { Router } from "express";
import { createChapterController, createCourseController } from "../controller/course.controller.js";
import { authorizeRoles } from "../middleware/auth.middleware.js";

const courseRouter = Router();

courseRouter.post("/", authorizeRoles("superadmin", "admin"),createCourseController);
courseRouter.post("/chapter", createChapterController);

export default courseRouter;
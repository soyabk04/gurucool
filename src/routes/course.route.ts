import { Router } from "express";
import { createChapterController, createCourseController,createQuestionController,createQuizController } from "../controller/course.controller.js";
import { authorizeRoles } from "../middleware/auth.middleware.js";

const courseRouter = Router();

courseRouter.post("/", authorizeRoles("superadmin", "admin"),createCourseController);
courseRouter.post("/chapter", createChapterController);
courseRouter.post("/quiz", createQuizController);
courseRouter.post("/question", createQuestionController);

export default courseRouter;
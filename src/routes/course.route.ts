import { Router } from "express";
import { createChapterController, createCourseController,createQuestionController,createQuizController,createEnrollmentController } from "../controller/course.controller.js";
import { authorizeRoles } from "../middleware/auth.middleware.js";
import { createEnrollment } from "../services/course.service.js";

const courseRouter = Router();

courseRouter.post("/", authorizeRoles("superadmin", "admin"),createCourseController);
courseRouter.post("/chapter", createChapterController);
courseRouter.post("/quiz", createQuizController);
courseRouter.post("/question", createQuestionController);
courseRouter.post("/enroll",createEnrollmentController)

export default courseRouter;
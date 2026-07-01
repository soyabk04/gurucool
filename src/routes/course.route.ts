import { Router } from "express";
import { createChapterController, createCourseController,createQuestionController,createQuizController,createEnrollmentController } from "../controller/course.controller.js";
import { authorizeRoles } from "../middleware/Authorization.middleware.js";
import { createEnrollment } from "../services/course.service.js";
import { authMiddleware } from "../middleware/authentication.middleware.js";
import { Assignmentvalidator, chapterValidator, courseValidator, questionValidator, quizValidator } from "../validator/courses.validator.js";

const courseRouter = Router();

courseRouter.post("/",authMiddleware ,authorizeRoles("superadmin", "admin"),courseValidator,createCourseController);
courseRouter.post("/chapter", authMiddleware, chapterValidator, createChapterController);
courseRouter.post("/quiz", authMiddleware, quizValidator, createQuizController);
courseRouter.post("/question", authMiddleware, questionValidator, createQuestionController);
courseRouter.post("/enroll", authMiddleware, Assignmentvalidator, createEnrollmentController)

export default courseRouter;
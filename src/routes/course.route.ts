import { Router } from "express";
import { createChapterController, getMyCoursesController,createCourseController,createQuestionController,createQuizController,createEnrollmentController, enrollGroupController, getCourseController } from "../controller/course.controller.js";
import { authorizeRoles } from "../middleware/Authorization.middleware.js";
import { authMiddleware } from "../middleware/authentication.middleware.js";
import { Assignmentvalidator, chapterValidator, courseValidator, questionValidator, quizValidator } from "../validator/courses.validator.js";
import { upload } from "../middleware/upload.middleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const courseRouter = Router();

courseRouter.post(
    "/",
    authMiddleware ,
    authorizeRoles("superadmin", "admin"),
    courseValidator,
    upload.single('thumbnail'),
    createCourseController
);
courseRouter.post(
    "/chapter",
     authMiddleware, 
     chapterValidator,
     upload.single('video')
     ,createChapterController);
courseRouter.post(
    "/quiz", 
    authMiddleware,
     quizValidator,
      createQuizController
    );
courseRouter.post(
    "/question",
     authMiddleware, 
     questionValidator, 
     createQuestionController
    );
courseRouter.post(
    "/enroll", 
    authMiddleware,
    authorizeRoles("superadmin", "admin"), 
    Assignmentvalidator, 
    createEnrollmentController
)
courseRouter.post("/enroll/group", 
    authMiddleware,
    authorizeRoles("superadmin", "admin"),
     enrollGroupController
    );
courseRouter.get(
    "/course/:courseId",
    getCourseController

)
courseRouter.get(
    "/mycourses",
    authMiddleware,
    authorizeRoles("superadmin", "admin", "coordinator", "user"),
    asyncHandler(getMyCoursesController)
);

export default courseRouter;
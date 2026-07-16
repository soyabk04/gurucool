import { Router } from "express";
import { createChapterController,getCoursesController, getOrganizationCoursesController,getEnrollGrpController,getEnrollOrgController,getMyCoursesController,createCourseController,createQuestionController,createQuizController,createEnrollmentController, enrollGroupController, getCourseController, enrollOrgController } from "../controller/course.controller.js";
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
    upload.single('thumbnail'),
    courseValidator,
    
    createCourseController
);
courseRouter.post(
    "/chapter",
     authMiddleware, 
     upload.single('file'),
     chapterValidator
     ,asyncHandler(createChapterController)
    );
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

courseRouter.get("/cour",
    authMiddleware,
    authorizeRoles('superadmin','admin'),
    getCoursesController
)

courseRouter.post("/enroll/group", 
    authMiddleware,
    authorizeRoles("admin"),
    enrollGroupController
    );
courseRouter.post("/enroll/org", 
    authMiddleware,
    authorizeRoles("superadmin"),
     enrollOrgController
    );
courseRouter.get("/enroll/org", 
    authMiddleware,
    authorizeRoles("admin","superadmin"),
     getEnrollOrgController
    );
courseRouter.get("/enroll/group", 
    authMiddleware,
    authorizeRoles("admin","superadmin"),
     getEnrollGrpController
    );
    courseRouter.get("/orgcourses", 
    authMiddleware,
    authorizeRoles("admin"),
     getCoursesController
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
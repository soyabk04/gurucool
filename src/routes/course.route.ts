import { Router } from "express";
import { createChapterController,getCoursesController,updateChapterProgressController,getCourseProgressController, getChapterController,getOrganizationCoursesController,getEnrollGrpController,getEnrollOrgController,getMyCoursesController,createCourseController,createQuestionController,createQuizController,assignCourseToUsersController, enrollGroupController, getCourseController, enrollOrgController } from "../controller/course.controller.js";
import { authorizeRoles } from "../middleware/Authorization.middleware.js";
import { authMiddleware } from "../middleware/authentication.middleware.js";
import { Assignmentvalidator, chapterValidator, courseValidator, questionValidator, quizValidator } from "../validator/courses.validator.js";
import { upload } from "../middleware/upload.middleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { createRateLimiter } from "../middleware/rateLimit.middleware.js";

const courseRouter = Router();

courseRouter.post(
    "/",
    createRateLimiter(10, 15, "Too many course creation requests."),
    authMiddleware,
    authorizeRoles("superadmin", "admin"),
    upload.single("thumbnail"),
    courseValidator,
    createCourseController
);

courseRouter.post(
    "/chapter",
    createRateLimiter(20, 15, "Too many chapter creation requests."),
    authMiddleware,
    authorizeRoles("superadmin", "admin"),
    upload.single("file"),
    chapterValidator,
    asyncHandler(createChapterController)
);

courseRouter.post(
    "/quiz",
    createRateLimiter(20, 15),
    authMiddleware,
    authorizeRoles("superadmin", "admin"),
    quizValidator,
    createQuizController
);

courseRouter.post(
    "/question",
    createRateLimiter(50, 15),
    authMiddleware,
    authorizeRoles("superadmin", "admin"),
    questionValidator,
    createQuestionController
);

courseRouter.post(
    "/enroll",
    createRateLimiter(30, 15),
    authMiddleware,
    authorizeRoles("superadmin", "admin", "coordinator"),
    assignCourseToUsersController
);

courseRouter.get(
    "/cour",
    createRateLimiter(200, 15),
    authMiddleware,
    authorizeRoles("superadmin", "admin", "coordinator", "user"),
    getCoursesController
);

courseRouter.post(
    "/enroll/group",
    createRateLimiter(10, 15),
    authMiddleware,
    authorizeRoles("admin"),
    enrollGroupController
);

courseRouter.post(
    "/enroll/org",
    createRateLimiter(5, 15),
    authMiddleware,
    authorizeRoles("superadmin"),
    enrollOrgController
);

courseRouter.get(
    "/enroll/org",
    createRateLimiter(100, 15),
    authMiddleware,
    authorizeRoles("admin", "superadmin"),
    getEnrollOrgController
);

courseRouter.get(
    "/enroll/group",
    createRateLimiter(100, 15),
    authMiddleware,
    authorizeRoles("admin", "superadmin"),
    getEnrollGrpController
);

courseRouter.get(
    "/orgcourses",
    createRateLimiter(100, 15),
    authMiddleware,
    authorizeRoles("admin"),
    getCoursesController
);

courseRouter.get(
    "/course/:courseId",
    createRateLimiter(200, 15),
    getCourseController
);

courseRouter.get(
    "/mycourses",
    createRateLimiter(100, 15),
    authMiddleware,
    authorizeRoles("superadmin", "admin", "coordinator", "user"),
    asyncHandler(getMyCoursesController)
);

courseRouter.get(
    "/chapter/:chapterId",
    createRateLimiter(200, 15),
    authMiddleware,
    authorizeRoles("coordinator", "user"),
    getChapterController
);
courseRouter.get(
  "/progress/:courseId",
  authMiddleware,
  getCourseProgressController
);

courseRouter.patch(
  "/:courseId/chapters/:chapterId/progress",
  authMiddleware,
  updateChapterProgressController
);
export default courseRouter;
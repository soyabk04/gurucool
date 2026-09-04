import { Router } from "express";
import { createChapterController,getCoursesController,updateChapterProgressController,getCourseProgressController, getChapterController,getOrganizationCoursesController,getEnrollGrpController,getEnrollOrgController,getMyCoursesController,createCourseController,createQuestionController,createQuizController,assignCourseToUsersController, enrollGroupController, getCourseController, enrollOrgController, getQuestionsController, quizSubmitController, getMyCertificatesController, updateChapterController, deleteChapterController } from "../controller/course.controller.js";
import { authorizeRoles } from "../middleware/Authorization.middleware.js";
import { authMiddleware } from "../middleware/authentication.middleware.js";
import { Assignmentvalidator, chapterValidator, courseValidator, questionValidator, quizValidator } from "../validator/courses.validator.js";
import { upload } from "../middleware/upload.middleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { createRateLimiter } from "../middleware/rateLimit.middleware.js";
import { getMyCertificatesService } from "../services/course.service.js";

const courseRouter = Router();

courseRouter.post(
    "/",

    createRateLimiter(
        10,
        15,
        "Too many course creation requests."
    ),

    authMiddleware,

    authorizeRoles(
        "superadmin",
        "admin"
    ),

    upload.fields([
        {
            name: "thumbnail",
            maxCount: 1,
        },
        {
            name: "certTemplate",
            maxCount: 1,
        },
    ]),

    courseValidator,

    asyncHandler(createCourseController)
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
    asyncHandler(createQuizController)
);

courseRouter.get(
    "/questions/:chapterId",
    authMiddleware,
    asyncHandler(getQuestionsController)
);
courseRouter.post(
    "/quiz/submit",
    createRateLimiter(20, 15),
    authMiddleware,
    asyncHandler(quizSubmitController)
);

courseRouter.post(
    "/enroll",
    createRateLimiter(30, 15),
    authMiddleware,
    authorizeRoles("superadmin", "admin", "coordinator"),
    asyncHandler(assignCourseToUsersController)
);

courseRouter.get(
    "/cour",
    createRateLimiter(200, 15),
    authMiddleware,
    authorizeRoles("superadmin", "admin", "coordinator", "user"),
    asyncHandler(getCoursesController)
);

courseRouter.post(
    "/enroll/group",
    createRateLimiter(10, 15),
    authMiddleware,
    authorizeRoles("admin"),
    asyncHandler(enrollGroupController)
);

courseRouter.post(
    "/enroll/org",
    createRateLimiter(5, 15),
    authMiddleware,
    authorizeRoles("superadmin"),
    asyncHandler(enrollOrgController)
);

courseRouter.get(
    "/enroll/org",
    createRateLimiter(100, 15),
    authMiddleware,
    authorizeRoles("admin", "superadmin"),
    asyncHandler(getEnrollOrgController)
);

courseRouter.get(
    "/enroll/group",
    createRateLimiter(100, 15),
    authMiddleware,
    authorizeRoles("admin", "superadmin"),
    asyncHandler(getEnrollGrpController)
);

courseRouter.get(
    "/orgcourses",
    createRateLimiter(100, 15),
    authMiddleware,
    authorizeRoles("admin"),
    asyncHandler(getCoursesController)
);

courseRouter.get(
    "/course/:courseId",
    createRateLimiter(200, 15),
    authMiddleware,
    asyncHandler(getCourseController)
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
    authorizeRoles("coordinator", "user",'admin','superadmin'),
    asyncHandler(getChapterController)
);
courseRouter.get(
  "/progress/:courseId",
  authMiddleware,
  asyncHandler(getCourseProgressController)
);
courseRouter.get(
  "/mycertificates",
  authMiddleware,
  authorizeRoles("superadmin", "admin", "coordinator", "user"),
  asyncHandler(getMyCertificatesController)
);

courseRouter.patch(
  "/:courseId/chapters/:chapterId/progress",
  authMiddleware,
  updateChapterProgressController
);
courseRouter.patch(
    "/chapter/update/:chapterId",
    authMiddleware,
    authorizeRoles("superadmin", "admin"),
    upload.single("video"),
    asyncHandler(updateChapterController)
);

courseRouter.delete(
    "/chapters/:chapterId",
    authMiddleware,
    asyncHandler(deleteChapterController)
);

export default courseRouter;
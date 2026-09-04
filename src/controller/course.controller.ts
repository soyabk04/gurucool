import { AppError } from "../errors/AppError.js";
import { createChapter, assignCourseToUsers, getMyCourses,getQuizQuestions,
     updateChapterProgressService,
     getCourseProgressService,getChapter,
      getOrganizationCourses, getassignCourseToOrganization,
       createCourse, getCourse, createQuestion, createQuiz,
        assignCourseToGroup, assignCourseToOrganization,
        questionCheck,getMyCertificatesService,
         getCourses, getassignCourseToGroup,
         updateChapter,
         deleteChapter,
         } from "../services/course.service.js";
import { type Request, type Response, type NextFunction } from "express";

export const createCourseController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
        const courseData = req.body.course;
        const user = req.user!;

        const files = req.files as {
            [fieldname: string]: Express.Multer.File[];
        };

        const thumbnail =
            files?.thumbnail?.[0];

        const certTemplate =
            files?.certTemplate?.[0];


        const course = await createCourse(
            courseData,
            user,
            thumbnail,
            certTemplate
        );


        return res.status(201).send({
            success: true,
            course,
            message: "Course created successfully",
        });

};
export const getCourseController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    
        const courseId = req.params.courseId;

        if (typeof courseId !== "string") {
            return res.status(400).json({
                success: false,
                message: "Invalid course id",
            });
        }

        const userInfo = req.user;

        if (!userInfo) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const response = await getCourse(
            courseId,
            {
                userId: userInfo.userId,
                role: userInfo.role,
            }
        );

        return res.status(200).json({
            success: true,
            course: response.course,
            chapters: response.chapters,
        });
    
};
export const getMyCoursesController = async (
    req: Request,
    res: Response
) => {
    const userInfo = req.user!;

    const response = await getMyCourses(userInfo);

    return res.status(200).json(response);
};
export const createChapterController = async (req: Request, res: Response) => {

    const chapterData = req.body.chapter;
    const quizData = req.body.chapter.quizData;
    const file = req.file!;
    const chapter = await createChapter(chapterData, quizData, file);
    res.status(201).json(chapter);

};

    
export const createQuizController = async (req: Request, res: Response) => {
        const quizData = req.body.validQuiz;
        const accessToken = req.headers.accesstoken as string;
        const quiz = await createQuiz(quizData);
        res.status(201).json(quiz);

};
export const quizSubmitController = async (req: Request, res: Response) => {
    const userAnswers = req.body.userAnswers;
    const userInfo = req.user!;
    const result = await questionCheck(userAnswers, userInfo);
    res.status(200).json(result);
}
export const getQuestionsController = async (req: Request, res: Response) => {

        const chapterId = req.params.chapterId!;
        if (typeof chapterId !== "string") {
            throw new AppError("Invalid chapterId", 400,'INVALID_CHAPTER_ID');
        }
        const question = await getQuizQuestions(chapterId);
        res.status(200).json(question);
};
export const createQuestionController = async (req: Request, res: Response) => {
        const questionData = req.body.validQuestions;
        const question = await createQuestion(questionData);
        res.status(201).json(question);

};

export const assignCourseToUsersController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

        const result = await assignCourseToUsers(
            req.body.assignment ?? req.body,
            req.user!
        );

        res.status(201).json({
            success: true,
            data: result,
        });

};
export const getCoursesController = async (req: Request, res: Response) => {
    const user = req.user!;
    const organizationId = req.query.organizationId as string | undefined

    const response = await getCourses(user, organizationId?organizationId:undefined);
   
    if (response) {
        res.send({
            success: true,
            res: response
        })
    }
}

export const enrollGroupController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    
        const { groupId, courseId } = req.body;
        const userInfo = req.user!
        console.log(groupId)
        if (!groupId || !courseId) {
            return res.status(400).json({
                success: false,
                message: "groupId and courseId are required.",
            });
        }

        const result = await assignCourseToGroup(groupId, courseId, userInfo);


        return res.status(201).json({
            success: true,
            data: result,
        });
    
};
export const enrollOrgController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
        const { organizationId, courseId } = req.body;
        const userInfo = req.user!
        if (!organizationId || !courseId) {
            return res.status(400).json({
                success: false,
                message: "organizationId and courseId are required.",
            });
        }

        const result = await assignCourseToOrganization(organizationId, courseId, userInfo);

        return res.status(201).json({
            success: true,
            message: `Enrolled ${result.enrolledCount} user(s). ${result.skippedCount} already enrolled.`,
            data: result,
        });

};
export const getEnrollOrgController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    

        const userInfo = req.user!


        const result = await getassignCourseToOrganization(userInfo);

        return res.status(201).json({
            success: true,
            data: result,
        });

};
export const getEnrollGrpController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    

        const userInfo = req.user!


        const result = await getassignCourseToGroup(userInfo);

        return res.status(201).json({
            success: true,
            data: result,
        });
   
    
};

export const updateChapterController = async (
    req: Request<{ chapterId: string }>,
    res: Response
) => {
    try {
        const { chapterId } = req.params;

        const userInfo = req.user;

        if (!userInfo) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        if (!chapterId) {
            return res.status(400).json({
                success: false,
                message: "Chapter ID is required",
            });
        }

        let chapterData = {};

        if (req.body.chapter) {
            try {
                chapterData =
                    typeof req.body.chapter === "string"
                        ? JSON.parse(req.body.chapter)
                        : req.body.chapter;
            } catch {
                return res.status(400).json({
                    success: false,
                    message: "Invalid chapter data",
                });
            }
        }

        let quizData = undefined;

        if (req.body.quiz) {
            try {
                quizData =
                    typeof req.body.quiz === "string"
                        ? JSON.parse(req.body.quiz)
                        : req.body.quiz;
            } catch {
                return res.status(400).json({
                    success: false,
                    message: "Invalid quiz data",
                });
            }
        }

        const chapter = await updateChapter(
            chapterId,
            chapterData,
            quizData,
            req.file,
            userInfo
        );

        return res.status(200).json({
            success: true,
            message: "Chapter updated successfully",
            data: chapter,
        });
    } catch (error) {
        throw error;
    }
};
export const getChapterController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  
    const user = req.user!;

    const chapterId = Array.isArray(req.params.chapterId)
      ? req.params.chapterId[0]
      : req.params.chapterId;

    if (!chapterId) {
      return res.status(400).json({
        success: false,
        message: "Chapter ID is required",
      });
    }

    const response = await getChapter(chapterId, user);

    return res.status(200).json(response,
    );
};
export const getOrganizationCoursesController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {


        const userInfo = req.user!


        const result = await getOrganizationCourses(userInfo);

        return res.status(201).json({
            success: true,
            data: result,
        });

};

export const updateChapterProgressController = async (
  req: Request,
  res: Response
) => {
    // Authentication check
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const userId = req.user.userId.toString();

    const { courseId, chapterId } = req.params;

    // Validate params
    if (
      typeof courseId !== "string" ||
      typeof chapterId !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid courseId or chapterId",
      });
    }

    const {
      watchedDuration,
      completed = false,
    } = req.body;

    // Validate watched duration
    if (
      watchedDuration === undefined ||
      watchedDuration === null
    ) {
      return res.status(400).json({
        success: false,
        message: "watchedDuration is required",
      });
    }

    const numericWatchedDuration =
      Number(watchedDuration);

    if (
      !Number.isFinite(numericWatchedDuration) ||
      numericWatchedDuration < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "watchedDuration must be a valid number",
      });
    }

    // Validate completed
    if (typeof completed !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "completed must be a boolean",
      });
    }

    // Update progress
    const progress =
      await updateChapterProgressService({
        userId,
        courseId,
        chapterId,
        watchedDuration: numericWatchedDuration,
        completed,
      });
    return res.status(200).json({
      success: true,
      message: completed
        ? "Chapter completed successfully"
        : "Chapter progress updated successfully",
      data: progress,
    });

};

export const getCourseProgressController = async (
  req: Request,
  res: Response
) => {
    // Make sure user is authenticated
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const userId = req.user.userId.toString();

    const { courseId } = req.params;

    // Validate courseId
    if (typeof courseId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const progress = await getCourseProgressService(
      userId,
      courseId
    );

    return res.status(200).json({
      success: true,
      data: progress,
    });

};

export const getMyCertificatesController = async (
  req: Request,
  res: Response
) => {

    const userInfo = req.user!;
    const certificates = await getMyCertificatesService(userInfo);
    return res.status(200).json({
      success: true,
      data: certificates,
    });

};
export const deleteChapterController = async (
    req: Request<{
        chapterId: string;
    }>,
    res: Response
) => {

        const { chapterId } =
            req.params;

        const userInfo =
            req.user;

        const result =
            await deleteChapter(
                chapterId,
                userInfo
            );

        return res.status(200).json({
            success: true,
            message:
                "Chapter deleted successfully",
            data: result,
        });

};
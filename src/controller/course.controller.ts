import { success } from "zod";
import { createChapter,getMyCourses, createCourse ,getCourse,createEnrollment,createQuestion,createQuiz,createEnrollmentByGroup} from "../services/course.service.js";
import { type Request, type Response,type NextFunction } from "express";

export const createCourseController = async (req: Request, res: Response,next:NextFunction) => {
    try {
        const courseData = req.body.validCourse;
        const user = req.user!;
        const file=req.file!;
        const course = await createCourse(courseData, user?.userId,file);
        res.status(201).send({
            success:true,
            message:"Course created success fully"
        })
    } catch (error: any) {
        next(error)
    }
};
export const getCourseController = async (req:Request,res:Response,next:NextFunction)=>
    {
        try{
            const courseId=req.params.courseId!;
            if(typeof courseId!=="string"){
            return res.status(400).json({ message: "Invalid email" });
            };
            const response= await getCourse(courseId)
            res.send({
                success:true,
                course:response
            })

        }catch(error:any){
            next(error)
        }
    }
export const getMyCoursesController = async (
  req: Request,
  res: Response
) => {
  const userInfo = req.user!;

  const response = await getMyCourses(userInfo);

  return res.status(200).json(response);
};
export const createChapterController = async (req: Request, res: Response) => {
    try {
        const chapterData = req.body.validChapter;
        const file=req.file!;
        const chapter = await createChapter(chapterData,file);
        res.status(201).json(chapter);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};
export const createQuizController = async (req: Request, res: Response) => {
    try {
        const quizData = req.body.validQuiz;
        const accessToken = req.headers.accesstoken as string;
        const quiz = await createQuiz(quizData);
        res.status(201).json(quiz);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};
export const createQuestionController = async (req: Request, res: Response) => {
    try {
        const questionData = req.body.validQuestions;
        const question = await createQuestion(questionData);
        res.status(201).json(question);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const createEnrollmentController = async (req: Request, res: Response) => {
    try {
        const enrollmentData = req.body.validAssignment;
        const enrollment = await createEnrollment(enrollmentData);
        res.status(201).json(enrollment);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const enrollGroupController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { groupId, courseId } = req.body;

        if (!groupId || !courseId) {
            return res.status(400).json({
                success: false,
                message: "groupId and courseId are required.",
            });
        }

        const result = await createEnrollmentByGroup(groupId, courseId);

        return res.status(201).json({
            success: true,
            message: `Enrolled ${result.enrolledCount} user(s). ${result.skippedCount} already enrolled.`,
            data: result,
        });
    } catch (error: any) {
        // Known/expected errors -> 400, everything else -> pass to error middleware
        const knownErrors = [
            "Course ID is required.",
            "Group ID is required.",
            "Course not found.",
            "Group not found.",
            "No users found for this group.",
            "All users in this group are already enrolled in this course.",
            "One or more users are already enrolled in this course.",
        ];

        if (knownErrors.includes(error.message)) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        next(error);
    }
};
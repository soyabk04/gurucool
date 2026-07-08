import { createChapter, createCourse ,createEnrollment,createQuestion,createQuiz,createEnrollmentByGroup} from "../services/course.service.js";
import { type Request, type Response,type NextFunction } from "express";

export const createCourseController = async (req: Request, res: Response) => {
    try {
        const courseData = req.body.validCourse;
        const user = req.user!;
        const course = await createCourse(courseData, user?.userId);
        res.status(201).json(course);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};
export const createChapterController = async (req: Request, res: Response) => {
    try {
        const chapterData = req.body.validChapter;
        const accessToken = req.headers.accesstoken as string;
        const chapter = await createChapter(chapterData);
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
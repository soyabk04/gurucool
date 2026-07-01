import { createChapter, createCourse ,createEnrollment,createQuestion,createQuiz} from "../services/course.service.js";
import { type Request, type Response } from "express";

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
        const chapter = await createChapter(chapterData, accessToken);
        res.status(201).json(chapter);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};
export const createQuizController = async (req: Request, res: Response) => {
    try {
        const quizData = req.body.validQuiz;
        const accessToken = req.headers.accesstoken as string;
        const quiz = await createQuiz(quizData, accessToken);
        res.status(201).json(quiz);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};
export const createQuestionController = async (req: Request, res: Response) => {
    try {
        const questionData = req.body.validQuestion;
        const accessToken = req.headers.accesstoken as string;
        const question = await createQuestion(questionData, accessToken);
        res.status(201).json(question);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const createEnrollmentController = async (req: Request, res: Response) => {
    try {
        const enrollmentData = req.body.ValidAssignment;
        const accessToken = req.headers.accesstoken as string;
        console.log(enrollmentData)
        const enrollment = await createEnrollment(enrollmentData, accessToken);
        res.status(201).json(enrollment);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};
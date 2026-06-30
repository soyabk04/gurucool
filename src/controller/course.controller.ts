import { createChapter, createCourse ,createQuestion,createQuiz} from "../services/course.service.js";
import { type Request, type Response } from "express";

export const createCourseController = async (req: Request, res: Response) => {
    try {
        const courseData = req.body;
        const course = await createCourse(courseData);
        res.status(201).json(course);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};
export const createChapterController = async (req: Request, res: Response) => {
    try {
        const chapterData = req.body;
        const chapter = await createChapter(chapterData);
        res.status(201).json(chapter);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};
export const createQuizController = async (req: Request, res: Response) => {
    try {
        const quizData = req.body;
        const quiz = await createQuiz(quizData);
        res.status(201).json(quiz);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};
export const createQuestionController = async (req: Request, res: Response) => {
    try {
        const questionData = req.body;
        const question = await createQuestion(questionData);
        res.status(201).json(question);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};
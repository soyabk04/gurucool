import { createChapter, createCourse } from "../services/course.service.js";
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
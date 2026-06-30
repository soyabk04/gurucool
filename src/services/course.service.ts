import {ChapterModel, CourseModel,QuestionModel,QuizModel,CourseProgressModel} from "../models/course.model.js";

export const createCourse = async (courseData: any) => {
    try {
        const course = new CourseModel(courseData);
        await course.save();
        return course;
    } catch (error) {
        throw new Error('Error creating course');
    }
};

export const createChapter = async (chapterData: any) => {
    try {
        const chapter = new ChapterModel(chapterData);
        await chapter.save();
        return chapter;
    } catch (error) {
        throw new Error('Error creating chapter');
    }
};

export const createQuestion = async (chapterData: any) => {
    try {
        const question = new QuestionModel(chapterData);
        await question.save();
        return question;
    } catch (error) {
        throw new Error('Error creating chapter');
    }
};

export const createQuiz = async (chapterData: any) => {
    try {
        const quiz = new QuizModel(chapterData);
        await quiz.save();
        return quiz;
    } catch (error) {
        throw new Error('Error creating chapter');
    }
};
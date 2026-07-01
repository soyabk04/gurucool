import { ATJWTKEY } from "../config/env.config.js";
import {ChapterModel, CourseModel,QuestionModel,QuizModel,CourseProgressModel,EnrollmentModel} from "../models/course.model.js";
import jwt from "jsonwebtoken";
import { Usermodel } from "../models/user.model.js";
import type { CourseAssignment } from "../types/courses.type.js";
import type { Chapter, Course, Question, Quiz } from "../types/courses.type.js";

export const createCourse = async (courseData: Course, userId: string) => {
    try {
        
        const user=await Usermodel.findById(userId);
        const course = new CourseModel({...courseData, instructor: user?._id});
        await course.save();
        return course;
    } catch (error) {
        throw new Error('Error creating course');
    }
};

export const createChapter = async (chapterData: Chapter, accessToken: string) => {
    try {
        const chapter = new ChapterModel(chapterData);
        await chapter.save();
        return chapter;
    } catch (error) {
        throw new Error('Error creating chapter');
    }
};

export const createQuestion = async (questionData: Question, accessToken: string) => {
    try {
        const question = new QuestionModel(questionData);
        await question.save();
        return question;
    } catch (error) {
        throw new Error('Error creating question');
    }
};

export const createQuiz = async (quizData: Quiz, accessToken: string) => {
    try {
        const quiz = new QuizModel(quizData);
        await quiz.save();
        return quiz;
    } catch (error) {
        throw new Error('Error creating quiz');
    }
};

export const createEnrollment = async (
  enrollData: CourseAssignment,
  accessToken: string
) => {
  try {
    const enrollment = new EnrollmentModel(enrollData);
    await enrollment.save();
    console.log(enrollment)
    return enrollment;
  } catch (error: any) {
    if (error.code === 11000) {
      throw new Error("User is already enrolled in this course.");
    }

    throw error;
  }
};
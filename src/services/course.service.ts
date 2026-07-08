import { ATJWTKEY } from "../config/env.config.js";
import {ChapterModel, CourseModel,QuestionModel,QuizModel,CourseProgressModel,EnrollmentModel} from "../models/course.model.js";
import mongoose from "mongoose";
import { Usermodel } from "../models/user.model.js";
import type { Enrollment } from "../types/courses.type.js";
import type { Chapter, Course, Question, Quiz } from "../types/courses.type.js";
import { Groupmodel } from "../models/organization.model.js";

export const createCourse = async (
    courseData: Course,
    userId: string
) => {
    const instructor = await Usermodel.findById(userId);

    if (!instructor) {
        throw new Error("Instructor not found.");
    }

    return await CourseModel.create({
        ...courseData,
        instructor: instructor._id,
    });
};

export const createChapter = async (
    chapterData: Chapter
) => {

    const courseExists = await CourseModel.exists({
        _id: chapterData.courseId,
    });

    if (!courseExists) {
        throw new Error("Course not found.");
    }

    return await ChapterModel.create(chapterData);
};

export const createQuestion = async (
    questionsData: Question[]
) => {

    if (questionsData.length === 0) {
        throw new Error("Questions array is empty.");
    }

    const quizId = questionsData[0]?.quizId;

    const quizExists = await QuizModel.exists({
        _id: quizId,
    });

    if (!quizExists) {
        throw new Error("Quiz not found.");
    }

    return await QuestionModel.insertMany(questionsData);
};

export const createQuiz = async (
    quizData: Quiz
) => {

    const chapterExists = await ChapterModel.exists({
        _id: quizData.chapterId,
    });

    if (!chapterExists) {
        throw new Error("Chapter not found.");
    }

    return await QuizModel.create(quizData);
};

export const createEnrollment = async (
    enrollmentData: Enrollment
) => {
    const session = await mongoose.startSession();

    try {
        await session.startTransaction();

        if (!enrollmentData.courseId) {
            throw new Error("Course ID is required.");
        }

        const [userExists, courseExists] = await Promise.all([
            Usermodel.exists({ _id: enrollmentData.userId }).session(session),
            CourseModel.exists({ _id: enrollmentData.courseId }).session(session),
        ]);

        if (!userExists) {
            throw new Error("User not found.");
        }

        if (!courseExists) {
            throw new Error("Course not found.");
        }

        const chapters = await ChapterModel.find({
            courseId: enrollmentData.courseId,
        }).session(session);

        const [enrollment] = await EnrollmentModel.create(
            [enrollmentData],
            { session }
        );

        if (!enrollment) {
            throw new Error("Enrollment failed. Please try again.");
        }

        if (chapters.length > 0) {
            await CourseProgressModel.insertMany(
                chapters.map((chapter) => ({
                    userId: enrollmentData.userId,
                    courseId: enrollmentData.courseId,
                    chapterId: chapter._id,
                    watchedDuration: 0,
                    completed: false,
                })),
                { session }
            );
        }

        await session.commitTransaction();

        return enrollment;
    } catch (error: any) {
        await session.abortTransaction();

        if (error.code === 11000) {
            throw new Error("User is already enrolled in this course.");
        }

        throw error;
    } finally {
        await session.endSession();
    }
};

export const createEnrollmentByGroup = async (
    groupId: string,
    courseId: string
) => {
    const session = await mongoose.startSession();

    try {
        await session.startTransaction();

        if (!courseId) {
            throw new Error("Course ID is required.");
        }
        if (!groupId) {
            throw new Error("Group ID is required.");
        }

        const [users, courseExists, groupDoc] = await Promise.all([
            Usermodel.find({ groupId }).select("_id").session(session),
            CourseModel.exists({ _id: courseId }).session(session),
            Groupmodel.findById(groupId).session(session),
        ]);

        if (!courseExists) {
            throw new Error("Course not found.");
        }
        if (!groupDoc) {
            throw new Error("Group not found.");
        }
        if (users.length === 0) {
            throw new Error("No users found for this group.");
        }

        const userIds = users.map((u) => u._id);

        // Skip users already enrolled in this course
        const existingEnrollments = await EnrollmentModel.find({
            userId: { $in: userIds },
            courseId,
        })
            .select("userId")
            .session(session);

        const alreadyEnrolledIds = new Set(
            existingEnrollments.map((e) => e.userId.toString())
        );

        const usersToEnroll = userIds.filter(
            (userId) => !alreadyEnrolledIds.has(userId.toString())
        );

        if (usersToEnroll.length === 0) {
            throw new Error("All users in this group are already enrolled in this course.");
        }

        const enrollmentDocs = usersToEnroll.map((userId) => ({
            userId,
            courseId,
            groupId,
            organizationId: groupDoc.organization,
        }));

        const enrollments = await EnrollmentModel.insertMany(enrollmentDocs, {
            session,
        });

        const chapters = await ChapterModel.find({ courseId }).session(session);

        if (chapters.length > 0) {
            const progressDocs = usersToEnroll.flatMap((userId) =>
                chapters.map((chapter) => ({
                    userId,
                    courseId,
                    chapterId: chapter._id,
                    watchedDuration: 0,
                    completed: false,
                }))
            );

            await CourseProgressModel.insertMany(progressDocs, { session });
        }

        await session.commitTransaction();

        return {
            enrolledCount: enrollments.length,
            skippedCount: alreadyEnrolledIds.size,
            enrollments,
        };
    } catch (error: any) {
        await session.abortTransaction();

        if (error.code === 11000) {
            throw new Error("One or more users are already enrolled in this course.");
        }

        throw error;
    } finally {
        await session.endSession();
    }
};
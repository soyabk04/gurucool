import { ChapterModel, GroupCourse,CertificateModel, CourseModel, OrganizationCourse, QuestionModel, QuizModel, CourseProgressModel, EnrollmentModel, QuizScoreModel, ChapterAccessDateModel } from "../models/course.model.js";
import mongoose from "mongoose";
import { Usermodel } from "../models/user.model.js";
import type { Chapter, Course, Enrollment, Question, Quiz } from "../types/courses.type.js";
import { Groupmodel } from "../models/organization.model.js";
import { R2Service } from "../utils/cloudflare.js";
import { AppError } from "../errors/AppError.js";
import { Organizationmodel } from "../models/organization.model.js";
import { getLogo, getVideoStreamUrl } from "../utils/getVideoUrl.js";

import {chapterAccessDateModel} from '../models/course.model.js'
import { generateCertificate } from "../utils/certificateGenerator.js";
import { userInfo } from "node:os";



export const createCourse = async ( 
    courseData: Course, 
    userInfo: { userId: string; role: string }, 
    file?: Express.Multer.File, 
    certTemplate?: Express.Multer.File 
) => { 
 
    // ========================================== 
    // 1. Find instructor 
    // ========================================== 
 
    const instructor = await Usermodel.findById( 
        userInfo.userId 
    ); 
 
    console.log( 
        "userInfo.role", 
        userInfo.role 
    ); 
 
    if (!instructor) { 
        throw new AppError( 
            "Instructor not found.", 
            404, 
            "INSTRUCTOR_NOT_FOUND" 
        ); 
    } 
 
 
    // ========================================== 
    // 2. Create course 
    // ========================================== 
 
    const course = await CourseModel.create({ 
        ...courseData, 
        instructor: instructor._id, 
    }); 
 
    if (!course) { 
        throw new AppError( 
            "Failed to create Course", 
            500, 
            "FAILED_CREATE_COURSE" 
        ); 
    } 
 
 
    // ========================================== 
    // 3. Upload course thumbnail 
    // ========================================== 
 
    if (file) { 
 
        const key = 
            `Courses/${course._id}/thumbnail`; 
 
        const uploaded = 
            await R2Service.upload( 
                file, 
                key 
            ); 
 
        if (!uploaded) { 
            throw new AppError( 
                "Failed to upload thumbnail of course", 
                500, 
                "THUMBNAIL_UPLOAD_FAILED" 
            ); 
        } 
 
        course.thumbnail = key; 
 
        await course.save(); 
    } 
 
 
    // ========================================== 
    // 4. Upload certificate template 
    // ========================================== 
 
    if (certTemplate) { 
 
        // Optional validation 
        if ( 
            certTemplate.mimetype !== 
            "application/pdf" 
        ) { 
            throw new AppError( 
                "Certificate template must be a PDF", 
                400, 
                "INVALID_CERTIFICATE_TEMPLATE" 
            ); 
        } 
 
 
        const key = 
            `Courses/${course._id}/certificate-template.pdf`; 
 
 
        const uploaded = 
            await R2Service.upload( 
                certTemplate, 
                key 
            ); 
 
 
        if (!uploaded) { 
            throw new AppError( 
                "Failed to upload certificate template", 
                500, 
                "CERTIFICATE_TEMPLATE_UPLOAD_FAILED" 
            ); 
        } 
 
 
        course.certTemplate = key; 
 
        await course.save(); 
    } 
 
 
    // ========================================== 
    // 5. Get user's organization 
    // ========================================== 
    if (userInfo.role == "superadmin") { 
 
    return { 
        course, 
    }; 
    } 
 
    const userOrganization = 
        await Usermodel 
            .findById(userInfo.userId) 
            .select("organization"); 
 
 
    if (!userOrganization?.organization) { 
        throw new AppError( 
            "User does not belong to any organization.", 
            400, 
            "USER_NO_ORGANIZATION" 
        ); 
    } 
 
 
    // ========================================== 
    // 6. Assign course to organization 
    // ========================================== 
 
    await assignCourseToOrganization( 
        userOrganization.organization.toString(), 
        course._id.toString(), 
        userInfo 
    ); 
 
 
    // ========================================== 
    // 7. Return course 
    // ========================================== 
 
    return { 
        course, 
    }; 
};

export const createChapter = async (
    chapterData: Chapter,
    quizData?: any,
    file?: Express.Multer.File
) => {
    // 1. Check course
    const courseExists = await CourseModel.exists({
        _id: chapterData.courseId,
    });

    if (!courseExists) {
        throw new AppError(
            "Course not found",
            400,
            "COURSE_NOT_FOUND"
        );
    }

    // 2. Get last serial number
    const lastChapter = await ChapterModel
        .findOne({
            courseId: chapterData.courseId,
        })
        .sort({ serialNo: -1 })
        .select("serialNo");

    chapterData.serialNo =
        (lastChapter?.serialNo ?? 0) + 1;

    // 3. Create chapter
    const chapter = await ChapterModel.create(
        chapterData
    );

    if (!chapter) {
        throw new AppError(
            "Failed to create chapter",
            500,
            "FAILED_CREATE_CHAPTER"
        );
    }

    // 4. Upload video/PDF if provided
    if (file) {
        const key = `Courses/${chapter.courseId}/${chapter._id}/video`;

        const uploaded = await R2Service.upload(
            file,
            key
        );

        if (!uploaded) {
            throw new AppError(
                "Failed to upload chapter video",
                500,
                "VIDEO_UPLOAD_FAILED"
            );
        }

        chapter.videoUrl = key;

        await chapter.save();
    }

    // 5. Create quiz if provided
    if (quizData) {
        const quiz = await QuizModel.create({
            chapterId: chapter._id,
            passingMarks: quizData.passingMarks,
            totalMarks: quizData.totalMarks,
        });

        // 6. Create questions
        const questionData = quizData.questions.map(
            (question: any) => ({
                quizId: quiz._id,

                question: question.question,

                options: question.options,

                answer: question.answer,

                marks: question.marks,
            })
        );

        if (questionData.length > 0) {
            await QuestionModel.insertMany(
                questionData
            );
        }
    }

    return chapter;
};

export const updateChapter = async (
    chapterId: string,
    chapterData: Partial<Chapter>,
    quizData?: {
        deleteQuiz?: boolean;
        passingMarks?: number;
        totalMarks?: number;
        questions?: {
            _id?: string;
            question: string;
            options: string[];
            answer: string;
            marks: number;
        }[];
    },
    file?: Express.Multer.File,
    userInfo?: {
        userId: string;
        role: string;
    }
) => {
    try {
        // ==========================================
        // 1. Validate chapter ID
        // ==========================================

        if (!mongoose.Types.ObjectId.isValid(chapterId)) {
            throw new AppError(
                "Invalid chapter id",
                400,
                "INVALID_CHAPTER_ID"
            );
        }

        // ==========================================
        // 2. Find chapter
        // ==========================================

        const chapter = await ChapterModel.findById(chapterId);

        if (!chapter) {
            throw new AppError(
                "Chapter not found",
                404,
                "CHAPTER_NOT_FOUND"
            );
        }

        // ==========================================
        // 3. Find course
        // ==========================================

        const course = await CourseModel.findById(
            chapter.courseId
        );

        if (!course) {
            throw new AppError(
                "Course not found",
                404,
                "COURSE_NOT_FOUND"
            );
        }

        // ==========================================
        // 4. Authorization
        // ==========================================

        if (!userInfo) {
            throw new AppError(
                "Unauthorized",
                401,
                "UNAUTHORIZED"
            );
        }

        const isSuperAdmin =
            userInfo.role === "superadmin";

        const isInstructor =
            course.instructor?.toString() ===
            userInfo.userId;

        if (!isSuperAdmin && !isInstructor) {
            throw new AppError(
                "User is not authorized to edit this chapter",
                403,
                "FORBIDDEN"
            );
        }

        // ==========================================
        // 5. Update chapter fields
        // ==========================================

        if (chapterData.title !== undefined) {
            chapter.title = chapterData.title;
        }

        if (chapterData.description !== undefined) {
            chapter.description =
                chapterData.description;
        }

        // Do NOT update:
        //
        // chapter.courseId
        // chapter.serialNo

        // ==========================================
        // 6. Upload new video
        // ==========================================

        if (file) {
            const key =
                `Courses/${chapter.courseId}/${chapter._id}/video`;

            const uploaded =
                await R2Service.upload(
                    file,
                    key
                );

            if (!uploaded) {
                throw new AppError(
                    "Failed to upload chapter video",
                    500,
                    "VIDEO_UPLOAD_FAILED"
                );
            }

            chapter.videoUrl = key;
        }

        // ==========================================
        // 7. Save chapter
        // ==========================================

        await chapter.save();

        // ==========================================
        // 8. Quiz handling
        // ==========================================

        if (quizData !== undefined) {
            const quiz = await QuizModel.findOne({
                chapterId: chapter._id,
            });

            // ======================================
            // 8A. DELETE ENTIRE QUIZ
            // ======================================

            if (quizData.deleteQuiz === true) {
                if (quiz) {
                    // Delete all questions belonging
                    // to this quiz first.
                    await QuestionModel.deleteMany({
                        quizId: quiz._id,
                    });

                    // Then delete the quiz itself.
                    await QuizModel.deleteOne({
                        _id: quiz._id,
                    });
                }
            }

            // ======================================
            // 8B. CREATE NEW QUIZ
            // ======================================

            else if (!quiz) {
                if (
                    quizData.passingMarks === undefined ||
                    quizData.totalMarks === undefined
                ) {
                    throw new AppError(
                        "Passing marks and total marks are required",
                        400,
                        "INVALID_QUIZ_DATA"
                    );
                }

                const newQuiz =
                    await QuizModel.create({
                        chapterId: chapter._id,
                        passingMarks:
                            quizData.passingMarks,
                        totalMarks:
                            quizData.totalMarks,
                    });

                // Create questions if supplied
                if (
                    quizData.questions &&
                    quizData.questions.length > 0
                ) {
                    const questionData =
                        quizData.questions.map(
                            (question) => ({
                                quizId: newQuiz._id,
                                question:
                                    question.question,
                                options:
                                    question.options,
                                answer:
                                    question.answer,
                                marks:
                                    question.marks,
                            })
                        );

                    await QuestionModel.insertMany(
                        questionData
                    );
                }
            }

            // ======================================
            // 8C. UPDATE EXISTING QUIZ
            // ======================================

            else {
                // ----------------------------------
                // Update passing marks
                // ----------------------------------

                if (
                    quizData.passingMarks !==
                    undefined
                ) {
                    quiz.passingMarks =
                        quizData.passingMarks;
                }

                // ----------------------------------
                // Update total marks
                // ----------------------------------

                if (
                    quizData.totalMarks !==
                    undefined
                ) {
                    quiz.totalMarks =
                        quizData.totalMarks;
                }

                await quiz.save();

                // ----------------------------------
                // Update questions
                // ----------------------------------

                if (
                    quizData.questions !==
                    undefined
                ) {
                    // Validate IDs first
                    for (
                        const question of
                        quizData.questions
                    ) {
                        if (
                            question._id &&
                            !mongoose.Types.ObjectId.isValid(
                                question._id
                            )
                        ) {
                            throw new AppError(
                                "Invalid question id",
                                400,
                                "INVALID_QUESTION_ID"
                            );
                        }
                    }

                    // ----------------------------------
                    // Get incoming existing question IDs
                    // ----------------------------------

                    const incomingQuestionIds =
                        quizData.questions
                            .filter(
                                (question) =>
                                    question._id
                            )
                            .map(
                                (question) =>
                                    new mongoose.Types.ObjectId(
                                        question._id!
                                    )
                            );

                    // ----------------------------------
                    // Delete removed questions
                    //
                    // Example:
                    //
                    // DB:
                    // Q1
                    // Q2
                    // Q3
                    //
                    // Frontend sends:
                    // Q1
                    // Q3
                    //
                    // Q2 gets deleted.
                    // ----------------------------------

                    await QuestionModel.deleteMany({
                        quizId: quiz._id,
                        _id: {
                            $nin:
                                incomingQuestionIds,
                        },
                    });

                    // ----------------------------------
                    // Update existing / create new
                    // ----------------------------------

                    for (
                        const question of
                        quizData.questions
                    ) {
                        // ==================================
                        // Existing question
                        // ==================================

                        if (question._id) {
                            const existingQuestion =
                                await QuestionModel.findOne(
                                    {
                                        _id:
                                            question._id,
                                        quizId:
                                            quiz._id,
                                    }
                                );

                            if (
                                !existingQuestion
                            ) {
                                throw new AppError(
                                    "Question not found",
                                    404,
                                    "QUESTION_NOT_FOUND"
                                );
                            }

                            existingQuestion.question =
                                question.question;

                            existingQuestion.options =
                                question.options;

                            existingQuestion.answer =
                                question.answer;

                            existingQuestion.marks =
                                question.marks;

                            await existingQuestion.save();
                        }

                        // ==================================
                        // New question
                        // ==================================

                        else {
                            await QuestionModel.create({
                                quizId: quiz._id,
                                question:
                                    question.question,
                                options:
                                    question.options,
                                answer:
                                    question.answer,
                                marks:
                                    question.marks,
                            });
                        }
                    }
                }
            }
        }

        // ==========================================
        // 9. Return updated chapter
        // ==========================================

        return chapter;
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        console.error(
            "Update chapter error:",
            error
        );

        throw new AppError(
            "Failed to update chapter",
            500,
            "FAILED_UPDATE_CHAPTER"
        );
    }
};
export const getQuizQuestions = async (chapterId: string) => {
    const quiz = await QuizModel.findOne({ chapterId });

    if (!quiz) {
        throw new AppError("Quiz not found", 404, "QUIZ_NOT_FOUND");
    }
    const questions = await QuestionModel.find({ quizId: quiz._id }).select("-quizId -__v -createdAt -updatedAt -answer");
    if (!questions || questions.length === 0) {
        throw new AppError("No questions found for this quiz", 404, "QUESTIONS_NOT_FOUND");
    }
    return questions;
};
export const questionCheck = async (
    userAnswers: { questionId: string; answer: string }[],
    userInfo: { userId: string ,role: string}) => {
        let obtianedMarks = 0;
        let totalMarks = 0;
        let passingMarks = 0;
        let quizId: string | null = null;
        for (const userAnswer of userAnswers) {
            const question = await QuestionModel.findById(userAnswer.questionId);
            if (!question) {
                throw new AppError("Question not found", 404, "QUESTION_NOT_FOUND");
            }
            quizId = question.quizId.toString();
            const quiz = await QuizModel.findById(quizId);
            passingMarks = quiz?.passingMarks ?? 0;
            if(userAnswer.answer === question.answer) {
                obtianedMarks += question.marks;
            }
            totalMarks += question.marks;
        }
        const passed = obtianedMarks >= passingMarks;
        const userScore = await QuizScoreModel.create({ userId: userInfo.userId, quizId,score: obtianedMarks, passed });
        return { score: obtianedMarks, totalMarks, passed };

}
export const getCourse = async (
    courseId: string,
    userInfo: {
        userId: string;
        role: string;
    }
) => {
    /*
     * --------------------------------------------------
     * 1. Validate course ID
     * --------------------------------------------------
     */

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw new AppError(
            "Invalid course id",
            400,
            "INVALID_COURSE_ID"
        );
    }

    /*
     * --------------------------------------------------
     * 2. Find course
     * --------------------------------------------------
     */

    const course = await CourseModel.findById(courseId);

    if (!course) {
        throw new AppError(
            "Course not found",
            404,
            "COURSE_NOT_FOUND"
        );
    }

    /*
     * --------------------------------------------------
     * 3. SUPERADMIN
     * --------------------------------------------------
     *
     * Superadmin can access any course.
     *
     * No enrollment required.
     * No progress restriction.
     * No chapter access-date restriction.
     * --------------------------------------------------
     */

    if (userInfo.role === "superadmin") {
        const chapters = await ChapterModel.find({
            courseId,
        })
            .sort({ serialNo: 1 })
            .lean();

        return {
            success: true,
            course,
            chapters: chapters.map((chapter) => ({
                ...chapter,

                completed: false,
                watchedDuration: 0,

                access: {
                    accessDate: null,
                    lastDate: null,
                    status: "available",
                },
            })),
        };
    }

    /*
     * --------------------------------------------------
     * 4. COORDINATOR
     * --------------------------------------------------
     *
     * Coordinator can access course content without
     * enrollment.
     *
     * No progress restriction.
     * No chapter access-date restriction.
     * --------------------------------------------------
     */

    if (userInfo.role === "coordinator" || userInfo.role === "admin" || userInfo.role === "superadmin") {
        const chapters = await ChapterModel.find({
            courseId,
        })
            .select("-courseId")
            .select("-videoUrl")
            .sort({ serialNo: 1 })
            .lean();

        return {
            success: true,
            course,
            chapters: chapters.map((chapter) => ({
                ...chapter,

                completed: false,
                watchedDuration: 0,

                access: {
                    accessDate: null,
                    lastDate: null,
                    status: "available",
                },
            })),
        };
    }

    /*
     * --------------------------------------------------
     * 5. ONLY USER CAN CONTINUE
     * --------------------------------------------------
     */

    // if (userInfo.role !== "user") {
    //     throw new AppError(
    //         "Forbidden",
    //         403,
    //         "FORBIDDEN"
    //     );
    // }

    /*
     * --------------------------------------------------
     * 6. Find enrollment
     * --------------------------------------------------
     */

    const enrollment =
        await EnrollmentModel.findOne({
            userId: userInfo.userId,
            courseId,
            status: "active",
        }).lean();

    if (!enrollment) {
        throw new AppError(
            "You are not enrolled in this course.",
            403,
            "NOT_ENROLLED"
        );
    }

    /*
     * --------------------------------------------------
     * 7. Get chapters
     * --------------------------------------------------
     */

    const chapters = await ChapterModel.find({
        courseId,
    })
        .select("-courseId")
        .select("-videoUrl")
        .sort({ serialNo: 1 })
        .lean();

    /*
     * --------------------------------------------------
     * 8. Get access dates
     * --------------------------------------------------
     */

    const accessDates =
        await ChapterAccessDateModel.find({
            enrollmentId: enrollment._id,
        }).lean();

    const accessMap = new Map(
        accessDates.map((item) => [
            item.chapterId.toString(),
            item,
        ])
    );

    /*
     * --------------------------------------------------
     * 9. Get progress
     * --------------------------------------------------
     */

    const progress =
        await CourseProgressModel.find({
            userId: userInfo.userId,
            courseId,
        }).lean();

    const progressMap = new Map(
        progress.map((item) => [
            item.chapterId.toString(),
            item,
        ])
    );

    /*
     * --------------------------------------------------
     * 10. Current time
     * --------------------------------------------------
     */

    const now = new Date();

    /*
     * --------------------------------------------------
     * 11. Build chapters
     * --------------------------------------------------
     */

    const chaptersWithAccess = chapters.map(
        (chapter, index) => {
            const access =
                accessMap.get(
                    chapter._id.toString()
                );

            const chapterProgress =
                progressMap.get(
                    chapter._id.toString()
                );

            let status:
                | "available"
                | "upcoming"
                | "expired"
                | "locked" = "available";

            /*
             * Access date
             */

            if (access) {
                const accessDate =
                    new Date(
                        access.accessDate
                    );

                const lastDate =
                    new Date(
                        access.lastDate
                    );

                if (now < accessDate) {
                    status = "upcoming";
                } else if (now > lastDate) {
                    status = "expired";
                } else {
                    status = "available";
                }
            }

            /*
             * Previous chapter
             */

            if (index > 0) {
                const previousChapter =
                    chapters[index - 1];

                const previousProgress =
                    progressMap.get(
                        previousChapter._id.toString()
                    );

                if (
                    !previousProgress?.completed
                ) {
                    status = "locked";
                }
            }

            return {
                ...chapter,

                completed:
                    chapterProgress?.completed ??
                    false,

                watchedDuration:
                    chapterProgress?.watchedDuration ??
                    0,

                access: access
                    ? {
                          accessDate:
                              access.accessDate,

                          lastDate:
                              access.lastDate,

                          status,
                      }
                    : {
                          accessDate: null,
                          lastDate: null,
                          status: "available",
                      },
            };
        }
    );

    /*
     * --------------------------------------------------
     * 12. Return
     * --------------------------------------------------
     */
    console.log(chaptersWithAccess);
    return {
        success: true,
        course,
        chapters: chaptersWithAccess,
    };
};
export const getMyCourses = async (userInfo: { userId: string; role: string }) => {

    const myCourses = await EnrollmentModel.find({
        userId: userInfo.userId,
    })
        .populate({
            path: "courseId",
            select: "_id title thumbnail",
        });

    if (myCourses.length === 0) {
        return {
            success: true,
            data: [],
        };
    }
    const courses = myCourses.map((enrollment) => enrollment.courseId)
    return {
        success: true,
        data: courses,
    };
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
export interface AssignCourseDto {
    courseId: string;
    userIds: string[];

    chapters: {
        chapterId: string;
        accessDate: Date;
        lastDate: Date;
    }[];
}

export const assignCourseToUsers = async (
    data: AssignCourseDto,
    actor: { userId: string; role: string }
) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const actorId = actor.userId;

        // =========================================================
        // 1. Get actor
        // =========================================================

        const actorUser = await Usermodel.findById(actorId)
            .select("organization groupId role")
            .session(session);

        if (!actorUser) {
            throw new AppError(
                "User not found",
                404,
                "USER_NOT_FOUND"
            );
        }

        // =========================================================
        // 2. Validate course
        // =========================================================

        const course = await CourseModel.findById(data.courseId)
            .session(session);

        if (!course) {
            throw new AppError(
                "Course not found.",
                404,
                "COURSE_NOT_FOUND"
            );
        }

        // =========================================================
        // 3. Validate user IDs
        // =========================================================

        const uniqueUserIds = [
            ...new Set(
                data.userIds.map((id) => id.toString())
            ),
        ];

        if (uniqueUserIds.length === 0) {
            throw new AppError(
                "No users selected.",
                400,
                "NO_USERS_SELECTED"
            );
        }

        // =========================================================
        // 4. Validate chapter schedules
        // =========================================================

        if (
            !data.chapters ||
            data.chapters.length === 0
        ) {
            throw new AppError(
                "Chapter access dates are required.",
                400,
                "CHAPTER_SCHEDULE_REQUIRED"
            );
        }

        // =========================================================
        // 5. Get course chapters
        // =========================================================

        const chapters = await ChapterModel.find({
            courseId: data.courseId,
        })
            .sort({ order: 1 })
            .session(session);

        if (chapters.length === 0) {
            throw new AppError(
                "This course does not have any chapters.",
                400,
                "NO_CHAPTERS"
            );
        }

        // =========================================================
        // 6. Validate that all course chapters have schedules
        // =========================================================

        const courseChapterIds = new Set(
            chapters.map((chapter) =>
                chapter._id.toString()
            )
        );

        const scheduledChapterIds = new Set<string>();

        for (const schedule of data.chapters) {
            const chapterId =
                schedule.chapterId.toString();

            // Check duplicate chapter schedule
            if (scheduledChapterIds.has(chapterId)) {
                throw new AppError(
                    `Duplicate schedule for chapter ${chapterId}.`,
                    400,
                    "DUPLICATE_CHAPTER_SCHEDULE"
                );
            }

            scheduledChapterIds.add(chapterId);

            // Check chapter belongs to course
            if (!courseChapterIds.has(chapterId)) {
                throw new AppError(
                    `Chapter ${chapterId} does not belong to this course.`,
                    400,
                    "INVALID_CHAPTER"
                );
            }

            // Parse dates
            const accessDate = new Date(
                schedule.accessDate
            );

            const lastDate = new Date(
                schedule.lastDate
            );

            // Validate dates
            if (
                Number.isNaN(accessDate.getTime()) ||
                Number.isNaN(lastDate.getTime())
            ) {
                throw new AppError(
                    `Invalid dates for chapter ${chapterId}.`,
                    400,
                    "INVALID_ACCESS_DATE"
                );
            }

            // Last date must be after access date
            if (accessDate >= lastDate) {
                throw new AppError(
                    `Last date must be after access date for chapter ${chapterId}.`,
                    400,
                    "INVALID_ACCESS_RANGE"
                );
            }
        }

        // Make sure every chapter has a schedule
        if (
            scheduledChapterIds.size !==
            courseChapterIds.size
        ) {
            throw new AppError(
                "Access dates must be provided for every chapter.",
                400,
                "MISSING_CHAPTER_SCHEDULE"
            );
        }

        // =========================================================
        // 7. Get users
        // =========================================================

        const users = await Usermodel.find({
            _id: { $in: uniqueUserIds },
        })
            .session(session);

        if (
            users.length !== uniqueUserIds.length
        ) {
            throw new AppError(
                "Some users do not exist.",
                400,
                "USERS_NOT_FOUND"
            );
        }

        // =========================================================
        // 8. Validate user permissions
        // =========================================================

        for (const user of users) {
            // -----------------------------------------------------
            // Admin
            // -----------------------------------------------------

            if (actor.role === "admin") {
                if (
                    !actorUser.organization ||
                    !user.organization ||
                    user.organization.toString() !==
                        actorUser.organization.toString()
                ) {
                    throw new AppError(
                        "Cannot enroll users outside your organization.",
                        403,
                        "FORBIDDEN"
                    );
                }
            }

            // -----------------------------------------------------
            // Coordinator
            // -----------------------------------------------------

            else if (
                actor.role === "coordinator"
            ) {
                if (
                    !actorUser.groupId ||
                    !user.groupId ||
                    user.groupId.toString() !==
                        actorUser.groupId.toString()
                ) {
                    throw new AppError(
                        "Cannot enroll users outside your group.",
                        403,
                        "FORBIDDEN"
                    );
                }
            }

            // -----------------------------------------------------
            // User must have organization and group
            // -----------------------------------------------------

            if (
                !user.organization ||
                !user.groupId
            ) {
                throw new AppError(
                    "User must belong to an organization and group before enrollment.",
                    400,
                    "USER_NOT_ASSIGNABLE"
                );
            }
        }

        // =========================================================
        // 9. Validate course assignment
        // =========================================================

        if (actor.role === "admin") {
            if (!actorUser.organization) {
                throw new AppError(
                    "Admin is not assigned to an organization.",
                    403,
                    "FORBIDDEN"
                );
            }

            const orgAssignment =
                await OrganizationCourse.findOne({
                    organizationId:
                        actorUser.organization,
                    courseId: data.courseId,
                    status: "active",
                }).session(session);

            if (!orgAssignment) {
                throw new AppError(
                    "This course is not assigned to your organization.",
                    403,
                    "COURSE_NOT_ASSIGNED"
                );
            }
        }

        else if (
            actor.role === "coordinator"
        ) {
            if (!actorUser.groupId) {
                throw new AppError(
                    "Coordinator is not assigned to a group.",
                    403,
                    "FORBIDDEN"
                );
            }

            const groupAssignment =
                await GroupCourse.findOne({
                    groupId: actorUser.groupId,
                    courseId: data.courseId,
                    status: "active",
                }).session(session);

            if (!groupAssignment) {
                throw new AppError(
                    "This course is not assigned to your group.",
                    403,
                    "COURSE_NOT_ASSIGNED"
                );
            }
        }

        // =========================================================
        // 10. Find existing enrollments
        // =========================================================

        const existingEnrollments =
            await EnrollmentModel.find({
                courseId: data.courseId,
                userId: { $in: uniqueUserIds },
            })
                .select("userId")
                .session(session);

        const enrolledIds = new Set(
            existingEnrollments.map(
                (enrollment) =>
                    enrollment.userId.toString()
            )
        );

        // =========================================================
        // 11. Create new enrollment objects
        // =========================================================

        const enrollments = users
            .filter(
                (user) =>
                    !enrolledIds.has(
                        user._id.toString()
                    )
            )
            .map((user) => ({
                userId: user._id,
                courseId: data.courseId,
                organizationId:
                    user.organization,
                groupId: user.groupId,
                enrolledBy: actorId,
                status: "active",
                progress: 0,
            }));

        if (enrollments.length === 0) {
            throw new AppError(
                "All selected users are already enrolled.",
                400,
                "ALREADY_ENROLLED"
            );
        }

        // =========================================================
        // 12. Create enrollments
        // =========================================================

        const createdEnrollments =
            await EnrollmentModel.insertMany(
                enrollments,
                { session }
            );

        // =========================================================
        // 13. Create CourseProgress documents
        // =========================================================

        const progressDocs = [];

        for (
            const enrollment of createdEnrollments
        ) {
            for (const chapter of chapters) {
                progressDocs.push({
                    userId: enrollment.userId,
                    courseId:
                        enrollment.courseId,
                    chapterId: chapter._id,
                    watchedDuration: 0,
                    completed: false,
                });
            }
        }

        if (progressDocs.length > 0) {
            await CourseProgressModel.insertMany(
                progressDocs,
                { session }
            );
        }

        // =========================================================
        // 14. Create ChapterAccessDate documents
        // =========================================================

        const chapterAccessDocs = [];

        for (
            const enrollment of createdEnrollments
        ) {
            for (const schedule of data.chapters) {
                const accessDate = new Date(
                    schedule.accessDate
                );

                const lastDate = new Date(
                    schedule.lastDate
                );

                chapterAccessDocs.push({
                    enrollmentId:
                        enrollment._id,

                    chapterId:
                        schedule.chapterId,

                    accessDate,

                    lastDate,
                });
            }
        }

        if (
            chapterAccessDocs.length > 0
        ) {
            await ChapterAccessDateModel.insertMany(
                chapterAccessDocs,
                { session }
            );
        }

        // =========================================================
        // 15. Commit transaction
        // =========================================================

        await session.commitTransaction();

        return {
            assigned: createdEnrollments.length,
        };
    } catch (error) {
        // =========================================================
        // Rollback everything if anything fails
        // =========================================================

        await session.abortTransaction();

        throw error;
    } finally {
        // =========================================================
        // Always close session
        // =========================================================

        await session.endSession();
    }
};
export const getCourses = async (userInfo: { userId: string; role: string }, organizationId?: string) => {
    if (userInfo.role === "superadmin") {
        if (organizationId) {
            const courses = await OrganizationCourse.find({
                organizationId: organizationId,
            }).populate("courseId",);

            return Promise.all(
                courses
                    .filter((item: any) => item.courseId)
                    .map(async (item: any) => ({
                        _id: item.courseId._id,
                        title: item.courseId.title,
                        thumbnail: item.courseId.thumbnail
                            ? await getVideoStreamUrl(item.courseId.thumbnail)
                            : null,
                    }))
            );
        }
        const courses = await CourseModel.find().select("_id title thumbnail");

        return Promise.all(
            courses.map(async (course) => ({
                _id: course._id,
                title: course.title,
                thumbnail: course.thumbnail
                    ? await getVideoStreamUrl(course.thumbnail)
                    : null,
            }))
        );
    }

    if (userInfo.role === "admin") {
        const courses = await OrganizationCourse.find({
            adminId: userInfo.userId,
        }).populate("courseId", "_id title thumbnail");

        return Promise.all(
            courses
                .filter((item: any) => item.courseId)
                .map(async (item: any) => ({
                    _id: item.courseId._id,
                    title: item.courseId.title,
                    thumbnail: item.courseId.thumbnail
                        ? await getVideoStreamUrl(item.courseId.thumbnail)
                        : null,
                }))
        );
    }

    if (userInfo.role === "coordinator") {
        const user = await Usermodel.findById(userInfo.userId).select("groupId");

        const courses = await GroupCourse.find({
            groupId: user?.groupId,
        }).populate("courseId", "_id title thumbnail");

        return Promise.all(
            courses
                .filter((item: any) => item.courseId)
                .map(async (item: any) => ({
                    _id: item.courseId._id,
                    title: item.courseId.title,
                    thumbnail: item.courseId.thumbnail
                        ? await getVideoStreamUrl(item.courseId.thumbnail)
                        : null,
                }))
        );
    }

    if (userInfo.role === "user") {
        const enrollments = await EnrollmentModel.find({
            userId: userInfo.userId,
        })
            .populate("courseId", "_id title thumbnail")
            .lean();

        return Promise.all(
            (enrollments as any[])
                .filter((e) => e.courseId)
                .map(async (e) => ({
                    _id: e.courseId._id,
                    title: e.courseId.title,
                    thumbnail: e.courseId.thumbnail
                        ? await getVideoStreamUrl(e.courseId.thumbnail)
                        : null,
                }))
        );
    }

    return [];
};
export const assignCourseToGroup = async (
    groupId: string,
    courseId: string,
    userInfo: { userId: string; role: string }
) => {
    if (userInfo.role !== "admin") {
        throw new Error("Only admins can assign courses to groups.");
    }

    const group = await Groupmodel.findById(groupId);

    if (!group) {
        throw new Error("Group not found.");
    }

    const organizationCourse = await OrganizationCourse.findOne({
        organizationId: group.organization,
        courseId,
        status: "active",
    });

    if (!organizationCourse) {
        throw new Error(
            "This course has not been assigned to your organization."
        );
    }

    const exists = await GroupCourse.exists({
        groupId,
        courseId,
    });

    if (exists) {
        throw new Error("Course already assigned to this group.");
    }

    const assignment = await GroupCourse.create({
        organizationCourseId: organizationCourse._id,
        organizationId: group.organization,
        groupId,
        courseId,
        assignedBy: userInfo.userId,
    });
    return assignment;
};



export const assignCourseToOrganization = async (
    organizationId: string,
    courseId: string,
    userInfo: { userId: string; role: string }
) => {

    if (userInfo?.role !== "superadmin" && userInfo?.role !== "admin") {
        throw new Error("Only Super Admin or Admin can assign courses.");
    }

    const [organization, course] = await Promise.all([
        Organizationmodel.findById(organizationId),
        CourseModel.findById(courseId),
    ]);

    if (!organization) {
        throw new Error("Organization not found.");
    }

    if (!course) {
        throw new Error("Course not found.");
    }

    const alreadyAssigned = await OrganizationCourse.exists({
        organizationId,
        courseId,
    });

    if (alreadyAssigned) {
        throw new Error("Course is already assigned to this organization.");
    }

    const assignment = await OrganizationCourse.create({
        organizationId,
        adminId: organization.adminUserId, // admin of this organization
        courseId,
        assignedBy: userInfo.userId,
    });

    return assignment;
};
export const getassignCourseToOrganization = async (userInfo: { userId: string, role: string }) => {
    const filter =
        userInfo.role === "superadmin"
            ? {}
            : userInfo.role === "admin"
                ? {
                    organizationId: (
                        await Usermodel.findById(userInfo.userId).select(
                            "organization"
                        )
                    )?.organization,
                }
                : null;

    if (filter === null || (userInfo.role === "admin" && !filter.organizationId)) {
        throw new AppError("Forbidden", 403, "FORBIDDEN");
    }

    const OrganizationCourses = await OrganizationCourse.find(filter)
        .populate("courseId organizationId");

    const result = await Promise.all(
        OrganizationCourses.map(async (OrganizationCourse) => ({
            _id: OrganizationCourse._id,
            organizationId: OrganizationCourse.organizationId,
            courseId: OrganizationCourse.courseId,
        }))
    );
    return result;
};

export const getassignCourseToGroup = async (userInfo: { userId: string, role: string }) => {
    const user = await Usermodel.findById(userInfo.userId)
    const OrganizationCourses = await GroupCourse.find({ organizationId: user?.organization })
        .populate("courseId groupId");

    const result = await Promise.all(
        OrganizationCourses.map(async (OrganizationCourse) => ({
            _id: OrganizationCourse._id,
            groupId: OrganizationCourse.groupId,
            courseId: OrganizationCourse.courseId,
        }))
    );
    return result



}

export const getOrganizationCourses = async (
    userInfo: { userId: string, role: string }) => {
    const OrganizationCourses = await OrganizationCourse.find({ adminId: userInfo.userId })
        .populate("courseId");

    const result = await Promise.all(
        OrganizationCourses.map(async (OrganizationCourse) => {
            const course = OrganizationCourse.courseId as {
                title?: string;
                _id?: unknown;
            } | null;
            if (!course?._id) {
                return null;
            }
            return {
                title: course.title,
                _id: course._id,
            };
        })
    );
    return result.filter(Boolean);
};
export const checkChapterAccess = async (
    userId: string,
    chapterId: string
) => {
    console.log(chapterId, userId);
    if (!mongoose.Types.ObjectId.isValid(chapterId)) {
        throw new AppError(
            "Invalid chapter id",
            400,
            "INVALID_CHAPTER_ID"
        );
    }

    const chapter = await ChapterModel.findById(
        chapterId
    ).select("courseId");

    if (!chapter) {
        throw new AppError(
            "Chapter not found.",
            404,
            "CHAPTER_NOT_FOUND"
        );
    }

    const enrollment =
        await EnrollmentModel.findOne({
            userId,
            courseId: chapter.courseId,
            status: "active",
        });

    if (!enrollment) {
        throw new AppError(
            "You are not enrolled in this course.",
            403,
            "NOT_ENROLLED"
        );
    }

    const access =
        await ChapterAccessDateModel.findOne({
            enrollmentId: enrollment._id,
            chapterId,
        });

    /*
     * No access-date configuration means
     * there is no date restriction.
     *
     * Allow the user to continue.
     */
    console.log("access:", access);
    if (!access) {
        return {
            allowed: true,
            enrollment,
            access: null,
        };
    }

    const now = new Date();

    /*
     * Chapter is not available yet.
     */
    if (now < access.accessDate) {
        throw new AppError(
            "This chapter is not available yet.",
            403,
            "CHAPTER_NOT_AVAILABLE"
        );
    }

    /*
     * Chapter access has expired.
     */
    if (now > access.lastDate) {
        throw new AppError(
            "Access to this chapter has expired.",
            403,
            "CHAPTER_ACCESS_EXPIRED"
        );
    }

    return {
        allowed: true,
        enrollment,
        access,
    };
};

export const getChapter = async (
    chapterId: string,
    userInfo: {
        userId: string;
        role: string;
    }
) => {

    /*
     * --------------------------------------------------
     * 1. Validate chapter ID
     * --------------------------------------------------
     */

    if (!mongoose.Types.ObjectId.isValid(chapterId)) {
        throw new AppError(
            "Invalid chapter id",
            400,
            "INVALID_CHAPTER_ID"
        );
    }

    /*
     * --------------------------------------------------
     * 2. Find chapter
     * --------------------------------------------------
     */

    const chapter = await ChapterModel.findById(
        chapterId
    );

    console.log("chapter:", chapter);

    if (!chapter) {
        throw new AppError(
            "Chapter not found.",
            404,
            "CHAPTER_NOT_FOUND"
        );
    }

    /*
     * --------------------------------------------------
     * 3. Check chapter access
     * --------------------------------------------------
     *
     * Only normal users need chapter access-date
     * restrictions.
     */

    if (userInfo.role === "user") {
        await checkChapterAccess(
            userInfo.userId,
            chapterId
        );
    }

    /*
     * --------------------------------------------------
     * 4. Check video
     * --------------------------------------------------
     */

    if (!chapter.videoUrl) {
        throw new AppError(
            "Video not available",
            404,
            "VIDEO_NOT_FOUND"
        );
    }

    /*
     * --------------------------------------------------
     * 5. Check previous chapter completion
     * --------------------------------------------------
     */

    if (
        userInfo.role === "user" &&
        chapter.serialNo > 1
    ) {
        const previousChapter =
            await ChapterModel.findOne({
                courseId: chapter.courseId,
                serialNo: chapter.serialNo - 1,
            });

        if (previousChapter) {
            const previousProgress =
                await CourseProgressModel.findOne({
                    userId: userInfo.userId,
                    courseId: chapter.courseId,
                    chapterId: previousChapter._id,
                });

            if (!previousProgress?.completed) {
                throw new AppError(
                    "Complete the previous chapter first",
                    403,
                    "CHAPTER_LOCKED"
                );
            }
        }
    }

    /*
     * --------------------------------------------------
     * 6. Generate video URL
     * --------------------------------------------------
     */


    const url = await getVideoStreamUrl(
        chapter.videoUrl
    );

    /*
     * --------------------------------------------------
     * 7. Return chapter
     * --------------------------------------------------
     */

    return {
        id: chapter._id,
        title: chapter.title,
        description: chapter.description,
        videoUrl: url,
        serialNo: chapter.serialNo,
    };
};


interface UpdateProgressData {
    userId: string;
    courseId: string;
    chapterId: string;
    watchedDuration: number;
    completed?: boolean;
}

interface UpdateProgressData {
  userId: string;
  courseId: string;
  chapterId: string;
  watchedDuration: number;
  completed?: boolean;
}

export const updateChapterProgressService = async ({
  userId,
  courseId,
  chapterId,
  watchedDuration,
  completed = false,
}: UpdateProgressData) => {
  // --------------------------------
  // 1. Validate IDs
  // --------------------------------

  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(courseId) ||
    !mongoose.Types.ObjectId.isValid(chapterId)
  ) {
    throw new Error(
      "Invalid user, course, or chapter ID"
    );
  }

  // --------------------------------
  // 2. Validate watched duration
  // --------------------------------

  if (
    !Number.isFinite(watchedDuration) ||
    watchedDuration < 0
  ) {
    throw new Error(
      "Watched duration cannot be negative"
    );
  }

  // --------------------------------
  // 3. Check chapter
  // --------------------------------

  const chapter = await ChapterModel.findOne({
    _id: chapterId,
    courseId,
  }).select("_id");

  if (!chapter) {
    throw new Error("Chapter not found");
  }

  // --------------------------------
  // 4. Check enrollment
  // --------------------------------

  const enrollment = await EnrollmentModel.findOne({
    userId,
    courseId,
  }).select("_id progress");

  if (!enrollment) {
    throw new Error(
      "You are not enrolled in this course"
    );
  }

  // --------------------------------
  // 5. Build progress update
  // --------------------------------

  const update: {
    $max: {
      watchedDuration: number;
    };
    $set?: {
      completed: boolean;
    };
  } = {
    $max: {
      watchedDuration,
    },
  };

  if (completed) {
    update.$set = {
      completed: true,
    };
  }

  // --------------------------------
  // 6. Create or update progress
  // --------------------------------

  const progress =
    await CourseProgressModel.findOneAndUpdate(
      {
        userId,
        courseId,
        chapterId,
      },
      update,
      {
        returnDocument: "after",
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

  // --------------------------------
  // 7. Calculate course progress
  // --------------------------------

  const totalChapters =
    await ChapterModel.countDocuments({
      courseId,
    });

  const completedChapters =
    await CourseProgressModel.countDocuments({
      userId,
      courseId,
      completed: true,
    });

  const courseProgress =
    totalChapters === 0
      ? 0
      : Math.round(
          (completedChapters / totalChapters) * 100
        );

  // --------------------------------
  // 8. Update enrollment progress
  // --------------------------------

  await EnrollmentModel.updateOne(
    {
      _id: enrollment._id,
    },
    {
      $set: {
        progress: courseProgress,
      },
    }
  );
  const course = await CourseModel.findById(courseId);
   const certLink =await getLogo(course.certTemplate || "")
   if (courseProgress === 100) {
    const user = await Usermodel.findById(userId)
    
    const organizationId = user?.organization?.toString() || ""
    const {key}=await generateCertificate({
        organizationId,
        groupId: user?.groupId?.toString() || "",
        courseId,
        userId,
        certTemplateLink: certLink || "",
    });
    const certificate = await CertificateModel.create({
        
        userId,
        courseId,
        organizationId,
        groupId: user?.groupId?.toString() || "",
        key,

    });

    certificate.save();

    await EnrollmentModel.updateOne(
      {
        _id: enrollment._id,
      },
      {
        $set: {
          completed: true,
        },
      }
    );
  }
  // --------------------------------
  // 9. Return everything
  // --------------------------------

  return {
    progress,
    courseProgress,
    completedChapters,
    totalChapters,
  };
};

export const getCourseProgressService = async (
  userId: string,
  courseId: string
) => {
  // Validate IDs
  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(courseId)
  ) {
    throw new Error("Invalid user or course ID");
  }

  // Check enrollment
  const enrollment = await EnrollmentModel.findOne({
    userId,
    courseId,
  }).select("_id progress");

  if (!enrollment) {
    throw new Error(
      "You are not enrolled in this course"
    );
  }

  // Get course chapters
  const chapters = await ChapterModel.find({
    courseId,
  })
    .sort({ order: 1 })
    .select("_id title order type");

  // Get user's chapter progress
  const progress = await CourseProgressModel.find({
    userId,
    courseId,
  }).select(
    "chapterId watchedDuration completed"
  );

  // Map progress by chapter
  const progressMap = new Map(
    progress.map((item) => [
      item.chapterId.toString(),
      item,
    ])
  );

  // Combine chapters with progress
  const chaptersWithProgress = chapters.map(
    (chapter) => {
      const chapterProgress = progressMap.get(
        chapter._id.toString()
      );

      return {
        _id: chapter._id,
        title: chapter.title,

        watchedDuration:
          chapterProgress?.watchedDuration ?? 0,

        completed:
          chapterProgress?.completed ?? false,
      };
    }
  );

  const totalChapters =
    chaptersWithProgress.length;

  const completedChapters =
    chaptersWithProgress.filter(
      (chapter) => chapter.completed
    ).length;

  const percentage =
    totalChapters === 0
      ? 0
      : Math.round(
          (completedChapters / totalChapters) * 100
        );

  return {
    courseId,

    progress: enrollment.progress ?? percentage,

    percentage,

    totalChapters,

    completedChapters,

    chapters: chaptersWithProgress,
  };
};

export const getMyCertificatesService = async (
    userInfo: {
        userId: string;
        role: string;
    }
) => {
    const certificates =
        await CertificateModel.find({
            userId: userInfo.userId,
        })
            .populate(
                "courseId",
                "title"
            )
            .lean();

    const certificatesWithUrls =
        await Promise.all(
            certificates.map(
                async (certificate) => {
                    const course =
                        certificate.courseId as unknown as {
                            title: string;
                        };

                    const certificateLink =
                        await getLogo(
                            certificate.key
                        );

                    return {
                        ...certificate,

                        courseTitle:
                            course?.title ?? "",

                        certificateLink,
                    };
                }
            )
        );

    return certificatesWithUrls;
};
export const deleteChapter = async (
    chapterId: string,
    userInfo?: {
        userId: string;
        role: string;
    }
) => {
    try {
        // ==========================================
        // 1. Validate chapter ID
        // ==========================================

        if (
            !mongoose.Types.ObjectId.isValid(
                chapterId
            )
        ) {
            throw new AppError(
                "Invalid chapter id",
                400,
                "INVALID_CHAPTER_ID"
            );
        }

        // ==========================================
        // 2. Find chapter
        // ==========================================

        const chapter =
            await ChapterModel.findById(
                chapterId
            );

        if (!chapter) {
            throw new AppError(
                "Chapter not found",
                404,
                "CHAPTER_NOT_FOUND"
            );
        }

        // ==========================================
        // 3. Find course
        // ==========================================

        const course =
            await CourseModel.findById(
                chapter.courseId
            );

        if (!course) {
            throw new AppError(
                "Course not found",
                404,
                "COURSE_NOT_FOUND"
            );
        }

        // ==========================================
        // 4. Authorization
        // ==========================================

        if (!userInfo) {
            throw new AppError(
                "Unauthorized",
                401,
                "UNAUTHORIZED"
            );
        }

        const isSuperAdmin =
            userInfo.role === "superadmin";

        const isInstructor =
            course.instructor?.toString() ===
            userInfo.userId;

        if (
            !isSuperAdmin &&
            !isInstructor
        ) {
            throw new AppError(
                "User is not authorized to delete this chapter",
                403,
                "FORBIDDEN"
            );
        }

        // ==========================================
        // 5. Find quiz
        // ==========================================

        const quiz =
            await QuizModel.findOne({
                chapterId: chapter._id,
            });

        // ==========================================
        // 6. Delete quiz questions
        // ==========================================

        if (quiz) {
            await QuestionModel.deleteMany({
                quizId: quiz._id,
            });
        }

        // ==========================================
        // 7. Delete quiz
        // ==========================================

        if (quiz) {
            await QuizModel.deleteOne({
                _id: quiz._id,
            });
        }

        // ==========================================
        // 8. Delete chapter
        // ==========================================

        await ChapterModel.deleteOne({
            _id: chapter._id,
        });

        // ==========================================
        // 9. Return result
        // ==========================================

        return {
            chapterId: chapter._id,
            message:
                "Chapter deleted successfully",
        };
    } catch (error) {
        // ==========================================
        // Preserve AppError
        // ==========================================

        if (error instanceof AppError) {
            throw error;
        }

        console.error(
            "Delete chapter error:",
            error
        );

        throw new AppError(
            "Failed to delete chapter",
            500,
            "FAILED_DELETE_CHAPTER"
        );
    }
};


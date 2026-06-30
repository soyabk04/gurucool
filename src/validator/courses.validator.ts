import { z } from "zod";
import mongoose from "mongoose";
import { type Request, type Response, type NextFunction } from "express";


const objectIdSchema = z
    .string()
    .trim()
    .refine(
        (id) => mongoose.Types.ObjectId.isValid(id),
        { message: "Invalid ObjectId" }
    )
    .transform((id) => new mongoose.Types.ObjectId(id));

const courseSchema = z.object({
    title: z.string().min(1, "too short"),
    description: z.string().min(1, "too short"),
    thumbnail: z.string().url(),
    price: z.number().min(1),
    instructor: objectIdSchema

});
const chapterSchema = z.object({
    serialNo: z.number(),
    course: objectIdSchema,
    title: z.string(),
    description: z.string(),
    videoUrl: z.string().url(),

});

const courseAssignmentSchema = z.object({
    courseId: objectIdSchema,
    userId: objectIdSchema,

});

const quizSchema = z.object({
    chapterId: objectIdSchema,
    userId: objectIdSchema,
})
const questionSchema = z.object({
    quizId: objectIdSchema,

    question: z.string().trim().min(1, "Question is required"),

    options: z
        .array(z.string().trim().min(1, "Option cannot be empty"))
        .length(4, "Exactly 4 options are required"),

    answer: z.string().trim().min(1, "Answer is required"),

    marks: z
        .number()
        .int()
        .positive("Marks must be greater than 0"),
});

export const validate =
    (schema: z.ZodType, key: string) =>
        (req: Request, res: Response, next: NextFunction) => {
            const result = schema.safeParse(req.body);

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    errors: result.error.issues,
                });
            }

            req.body[key] = result.data;

            next();
        };

const courseValidator =
    validate(courseSchema, "validCourse");

const chapterValidator =
    validate(chapterSchema, "validChapter");

const Assignmentvalidator =
    validate(courseAssignmentSchema, "validAssignment");
const quizValidator =
    validate(quizSchema, "validQuiz");

const questionValidator =
    validate(questionSchema, "validQuestion");
export { courseValidator, chapterValidator, Assignmentvalidator, quizValidator, questionValidator };

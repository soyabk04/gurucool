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
    organizationId: objectIdSchema,
    groupId: objectIdSchema,
    assignedBy: objectIdSchema,
    assignedAt: z.date(),
    dueDate: z.date(),
    progress: z.number().min(0).max(100),
    status: z.enum(["pending", "completed"]),

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
const courseProgressSchema = z.object({
  userId: objectIdSchema,

  courseId: objectIdSchema,

  chapterId: objectIdSchema,

  watchedDuration: z
    .number()
    .int()
    .nonnegative("Watched duration cannot be negative"),

  completed: z.boolean(),
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

export const validateMultiple =
  (schema: z.ZodTypeAny, key: string) =>
  (req: Request, res: Response, next: NextFunction) => {

    const items = req.body[key];

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: `${key} must be an array.`,
      });
    }

    const validItems = [];
    const errors = [];

    for (let i = 0; i < items.length; i++) {
      const result = schema.safeParse(items[i]);

      if (result.success) {
        validItems.push(result.data);
      } else {
        errors.push({
          index: i,
          issues: result.error.issues,
        });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors,
      });
    }

    req.body[key] = validItems;
    req.body.failedItems = errors;

    next();
  };

const courseProgressValidator = validate(
  courseProgressSchema,
  "validCourseProgress"
);

const courseValidator =
    validate(courseSchema, "validCourse");

const chapterValidator =
    validate(chapterSchema, "validChapter");

const Assignmentvalidator =
    validate(courseAssignmentSchema, "validAssignment");
const quizValidator =
    validate(quizSchema, "validQuiz");

const questionValidator =
    validateMultiple(questionSchema, "validQuestions");
export { courseValidator, chapterValidator,courseProgressValidator, Assignmentvalidator, quizValidator, questionValidator };

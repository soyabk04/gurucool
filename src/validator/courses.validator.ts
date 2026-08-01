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
  thumbnail: z.string().optional(),
});
const chapterSchema = z.object({
  serialNo: z.number().optional(),
  courseId: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  videoUrl: z.string().url().optional(),
});

const courseAssignmentSchema = z.object({
  courseId: z.string(),
  userIds: z.string().array(),
  organizationId: objectIdSchema.optional(),
  groupId: objectIdSchema.optional(),
  enrolledBy: objectIdSchema.optional(),
  progress: z.number().min(0).max(100).optional(),
  status: z.enum(["active", "completed"]).optional(),

});

const quizSchema = z.object({
  chapterId: objectIdSchema,
  passingMarks: z.number().int().nonnegative(),
  totalMarks: z.number().int().positive(),
});
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
  (schema: z.ZodTypeAny, key: string) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      
      const payload = req.body[key];
      
      if (!payload) {
        return res.status(400).json({
          success: false,
          message: `${key} is required`,
        });
      }

      const parsed =
        typeof payload === "string"
          ? JSON.parse(payload)
          : payload;
     
      const result = schema.safeParse(parsed);
      
      if (!result.success) {
       
        return res.status(400).json({
          success: false,
          errors: result.error.issues,
        });
      }

      req.body[key] = result.data;
      next();
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid JSON format",
      });
    }
  };

export const validateMultiple = (schema: z.ZodTypeAny, key: string) =>
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
  validate(courseSchema, "course");

const chapterValidator =
  validate(chapterSchema, "chapter");

const Assignmentvalidator =
  validate(courseAssignmentSchema, "assignment");
const quizValidator =
  validate(quizSchema, "validQuiz");

const questionValidator =
  validateMultiple(questionSchema, "validQuestions");
export { courseValidator, chapterValidator, courseProgressValidator, Assignmentvalidator, quizValidator, questionValidator };

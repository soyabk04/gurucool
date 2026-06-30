import mongoose from "mongoose";
import type {
    Course,
    Chapter,
    CourseAssignment,
    Quiz,
    Question,
    CourseProgress,
} from "../types/courses.type.js";

const { Schema, model, models } = mongoose;


//    Course


const courseSchema = new Schema<Course>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            required: true,
            trim: true,
        },

        thumbnail: {
            type: String,
            required: true,
            match: /^https?:\/\/.+/,
        },

        instructor: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        price: {
            type: Number,
            required: true,
            min: 1,
        },
    },
    {
        timestamps: true,
    }
);


//    Chapter


const chapterSchema = new Schema<Chapter>(
    {
        serialNo: {
            type: Number,
            required: true,
            min: 1,
        },

        courseId: {
            type: Schema.Types.ObjectId,
            ref: "Course",
            required: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            required: true,
            trim: true,
        },

        videoUrl: {
            type: String,
            required: true,
            match: /^https?:\/\/.+/,
        },
    },
    {
        timestamps: true,
    }
);

chapterSchema.index(
    {
        courseId: 1,
        serialNo: 1,
    },
    {
        unique: true,
    }
);


//   Enrollment


const assignmentSchema = new Schema<CourseAssignment>(
    {
        courseId: {
            type: Schema.Types.ObjectId,
            ref: "Course",
            required: true,
        },

        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

assignmentSchema.index(
    {
        courseId: 1,
        userId: 1,
    },
    {
        unique: true,
    }
);


//  Quiz


const quizSchema = new Schema<Quiz>(
    {
        chapterId: {
            type: Schema.Types.ObjectId,
            ref: "Chapter",
            required: true,
        },

        passingMarks: {
            type: Number,
            required: true,
            min: 0,
        },

        totalMarks: {
            type: Number,
            required: true,
            min: 1,
        },
    },
    {
        timestamps: true,
    }
);

quizSchema.index({
    chapterId: 1,
});


//   Question


const questionSchema = new Schema<Question>(
    {
        quizId: {
            type: Schema.Types.ObjectId,
            ref: "Quiz",
            required: true,
            index: true,
        },

        question: {
            type: String,
            required: true,
            trim: true,
        },

        options: {
            type: [String],
            required: true,
            validate: {
                validator: (v: string[]) => v.length === 4,
                message: "Exactly 4 options are required",
            },
        },

        answer: {
            type: String,
            required: true,
            trim: true,
        },

        marks: {
            type: Number,
            required: true,
            min: 1,
        },
    },
    {
        timestamps: true,
    }
);

questionSchema.path("answer").validate(function (value: string) {
  return this.options.includes(value);
}, "Answer must be one of the options.");

//Course Progress 



const courseProgressSchema = new Schema<CourseProgress>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        courseId: {
            type: Schema.Types.ObjectId,
            ref: "Course",
            required: true,
            index: true,
        },

        chapterId: {
            type: Schema.Types.ObjectId,
            ref: "Chapter",
            required: true,
            index: true,
        },

        watchedDuration: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },

        completed: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

courseProgressSchema.index(
    {
        userId: 1,
        courseId: 1,
        chapterId: 1,
    },
    {
        unique: true,
    }
);


//Models


export const CourseModel =
    models.Course || model<Course>("Course", courseSchema);

export const ChapterModel =
    models.Chapter || model<Chapter>("Chapter", chapterSchema);

export const EnrollmentModel =
    models.CourseAssignment ||
    model<CourseAssignment>("CourseAssignment", assignmentSchema);

export const QuizModel =
    models.Quiz || model<Quiz>("Quiz", quizSchema);

export const QuestionModel =
    models.Question || model<Question>("Question", questionSchema);

export const CourseProgressModel =
    models.CourseProgress ||
    model<CourseProgress>("CourseProgress", courseProgressSchema);
import mongoose, { Model, Types } from "mongoose";
import type {
    Course,
    Chapter,
    Enrollment,
    Quiz,
    Question,
    CourseProgress,
} from "../types/courses.type.js";
import { string } from "zod";
import { required } from "zod/mini";
import { types } from "node:util";

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
            required: false,
        },

        instructor: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
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
            required: false,

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
const OrganizationCourseSchema = new Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true,
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    assignedAt: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
    },
});

OrganizationCourseSchema.index(
    { organizationId: 1, courseId: 1 },
    { unique: true }
);


const GroupCourseSchema = new Schema(
    {
        organizationCourseId: {
            type: Schema.Types.ObjectId,
            ref: "OrganizationCourse",
            required: true,
        },
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        groupId: {
            type: Schema.Types.ObjectId,
            ref: "group",
            required: true,
        },
        courseId: {
            type: Schema.Types.ObjectId,
            ref: "Course",
            required: true,
        },
        assignedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        assignedAt: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
    },
    { timestamps: true }
);

GroupCourseSchema.index(
    {
        groupId: 1,
        courseId: 1,
    },
    { unique: true }
);



const enrollmentSchema = new Schema<Enrollment>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: false,
            index: true
        },

        courseId: {
            type: Schema.Types.ObjectId,
            ref: "Course",
            required: true,
            index: true
        },

        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true
        },

        groupId: {
            type: Schema.Types.ObjectId,
            ref: "group",
            required: true,
            index: true
        },

        enrolledBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },

        status: {
            type: String,
            enum: ["active", "completed"],
            default: "active"
        },

        completedAt: {
            type: Date
        },
        progress: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        }
    },
    {
        timestamps: true
    });

enrollmentSchema.index(
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

const quizScoreSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },

    quizId: {
        type: Schema.Types.ObjectId,
        ref: "Quiz",
        required: true,
        index: true,
    },

    score: {
        type: Number,
        required: true,
        min: 0,
    },

    passed: {
        type: Boolean,
        required: true,
    },
}, {
    timestamps: true
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

const chapterAccessDateSchema = new Schema({
    enrollmentId: {
        type: Types.ObjectId,
        ref: 'Enrollment',
        required: true,
        index: true
    },

    chapterId: {
        type: Types.ObjectId,
        ref: 'Chapter',
        required: true,
        index: true
    },

    accessDate: {
        type: Date,
        required: true
    },
    lastDate:{
        type:Date,
        required:true,
    }
}, {
    timestamps: true
});

chapterAccessDateSchema.index(
    { enrollmentId: 1, chapterId: 1 },
    { unique: true }
);



//Models


export const CourseModel =
    models.Course || model<Course>("Course", courseSchema);
export const chapterAccessDateModel=
    models.chapterAccessDate || model("chapterAccessDate", chapterAccessDateSchema);

export const OrganizationCourse =
    models.OrganizationCourse || model("OrgEnroll", OrganizationCourseSchema);
export const GroupCourse =
    models.GroupCourse || model("GrpEnroll", GroupCourseSchema);

export const ChapterModel: Model<Chapter> =
    models.Chapter || model<Chapter>("Chapter", chapterSchema);

export const EnrollmentModel: Model<Enrollment> =
    models.Enrollment || model<Enrollment>("Enrollment", enrollmentSchema);

export const QuizModel: Model<Quiz> =
    models.Quiz || model<Quiz>("Quiz", quizSchema);

export const QuestionModel: Model<Question> =
    models.Question || model<Question>("Question", questionSchema);

export const CourseProgressModel: Model<CourseProgress> =
    models.CourseProgress ||
    model<CourseProgress>("CourseProgress", courseProgressSchema);

export const QuizScoreModel: Model<any> =
    models.QuizScore ||
    model<any>("QuizScore", quizScoreSchema);
export const ChapterAccessDateModel: Model<any> =
    models.ChapterAccessDate ||
    model<any>("ChapterAccessDate", chapterAccessDateSchema);
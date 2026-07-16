import {Types} from 'mongoose';

export interface Course {
    title: string;
    description: string;
    thumbnail: string;
    instructor: Types.ObjectId; // Reference to User model
    createdAt?: Date;
    updatedAt?: Date;
}
export interface Chapter{
    serialNo:number;
    courseId: Types.ObjectId;
    title: string;
    description: string;
    videoUrl: string;
    duration: number; 
}
export interface Enrollment {
    userId: Types.ObjectId;
    courseId: Types.ObjectId;

    organizationId: Types.ObjectId;
    groupId: Types.ObjectId;

    enrolledBy: Types.ObjectId;

    enrolledAt: Date;

    completedAt?: Date;
    progress?: number;

    status: "active" | "completed";
}
export interface Quiz {
  chapterId: Types.ObjectId;
  passingMarks?: number;
  totalMarks?: number;
}
export interface Question {
  quizId: Types.ObjectId;
  question: string;
  options: string[];
  answer: string;
  marks: number;
}


export interface CourseProgress {
    userId: Types.ObjectId;
    courseId: Types.ObjectId;
    chapterId: Types.ObjectId;

    watchedDuration: number;
    completed: boolean;

    lastWatchedAt: Date;

    updatedAt?: Date;
}

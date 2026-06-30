import {Types} from 'mongoose';

export interface Course {
    title: string;
    description: string;
    thumbnail: string;
    instructor: Types.ObjectId; // Reference to User model
    price: number;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface Chapter{
    serialNo:number;
    courseId: Types.ObjectId;
    title: string;
    description: string;
    videoUrl: string;
    duration: number; // Duration in minutes
}
export interface CourseAssignment{
    courseId: Types.ObjectId;
    userId: Types.ObjectId;
    enrollmentDate: Date;
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
}


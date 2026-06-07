import mongoose from 'mongoose';

export interface Course {
    title: string;
    description: string;
    thumbnail: string;
    instructor: mongoose.Schema.Types.ObjectId; // Reference to User model
    price: number; //
    category: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    createdAt?: Date;
    updatedAt?: Date;
}
export interface chapter{
    courseId: mongoose.Schema.Types.ObjectId;
    title: string;
    description: string;
    videoUrl: string;
    duration: number; // Duration in minutes
}
export interface enrollment{
    courseId: mongoose.Schema.Types.ObjectId;
    userId: mongoose.Schema.Types.ObjectId;
    enrollmentDate: Date;
    progress: number; // Progress percentage
}
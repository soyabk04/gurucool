import { Types } from "mongoose";

export interface DashboardAnalytics {

    totalCourses: number;

    totalStudents: number;

    totalOrganizations: number;

    totalGroups: number;

    totalEnrollments: number;

    activeStudents: number;

    completedEnrollments: number;

    completionRate: number;

    averageProgress: number;

    averageWatchTime: number;
}

export interface CourseAnalytics {

    courseId: Types.ObjectId;

    title: string;

    totalStudents: number;

    completedStudents: number;

    activeStudents: number;

    completionRate: number;

    averageProgress: number;

    averageWatchTime: number;

    chapters: number;
}

export interface EnrollmentTrend {

    date: string;

    count: number;
}

export interface ProgressBucket {

    range: string;

    students: number;
}
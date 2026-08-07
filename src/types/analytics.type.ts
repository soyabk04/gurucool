import { Types } from "mongoose";

export interface StudentActivity {
  day: string;
  activeStudents: number;
}

export interface EnrollmentTrend {
  month: string;
  enrollments: number;
}

export interface CompletionDistribution {
  name: "Completed" | "In Progress" | "Not Started";
  value: number;
}

export interface PopularCourse {
  id: string;
  name: string;
  students: number;
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

export interface DashboardStats {
  totalStudents: number;
  totalCoordinators: number;
  totalGroups: number;
  totalCourses: number;
  totalEnrollments: number;

  activeStudents: number;

  averageProgress: number;

  completionRate: number;
}
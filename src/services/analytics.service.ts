import { Usermodel } from "../models/user.model.js";
import { dashboardAnalyticsRepository } from "../repository/analytics.repository.js";
import mongoose from "mongoose";
import { getCourseOverviewRepository } from "../repository/analytics.repository.js";
export const dashboardAnalyticsService = async (
    user: any
) => {
    const User=await Usermodel.findById(user.userId);

    if (!User) {
        throw new Error("User not found");
    }

    const analytics = await dashboardAnalyticsRepository(User);

    return analytics;

};



export const getCourseOverviewService = async (
    courseId: string
) => {

    if (!mongoose.isValidObjectId(courseId)) {
        throw new Error("Invalid course id");
    }

    const analytics =
        await getCourseOverviewRepository(courseId);

    if (!analytics) {
        throw new Error("Course not found");
    }

    return analytics;
};
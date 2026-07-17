import type{ Request, Response } from "express";
import { dashboardAnalyticsService } from "../services/analytics.service.js";
import { getCourseOverviewService } from "../services/analytics.service.js";
import { AppError } from "../errors/AppError.js";

export const dashboardAnalyticsController = async (
    req: Request,
    res: Response
) => {

    const analytics = await dashboardAnalyticsService(req.user);

    return res.status(200).json({
        success: true,
        data: analytics
    });

};

export const getCourseOverviewController = async (
    req: Request,
    res: Response
) => {
const { courseId } = req.params;

if (typeof courseId !== "string") {
    throw new AppError("Invalid courseId", 400, "INVALID_COURSE_ID");
}
    const analytics =
        await getCourseOverviewService(
            courseId
        );

    return res.status(200).json({
        success: true,
        data: analytics
    });

};
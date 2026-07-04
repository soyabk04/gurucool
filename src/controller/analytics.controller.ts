import type{ Request, Response } from "express";
import { dashboardAnalyticsService } from "../services/analytics.service.js";
import { getCourseOverviewService } from "../services/analytics.service.js";

export const dashboardAnalyticsController = async (
    req: Request,
    res: Response
) => {

    try {

        const analytics = await dashboardAnalyticsService(req.user);

        return res.status(200).json({
            success: true,
            data: analytics
        });

    } catch (error: any) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

export const getCourseOverviewController = async (
    req: Request,
    res: Response
) => {
const { courseId } = req.params;

if (typeof courseId !== "string") {
    return res.status(400).json({
        success: false,
        message: "Invalid courseId"
    });
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
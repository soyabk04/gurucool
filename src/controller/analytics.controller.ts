import { Request, Response } from "express";
import { getDashboardService } from "../services/analytics.service.js";

export const getDashboard =async (req: Request, res: Response) => {
        const userInfo = req.user;
        if (!userInfo) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        const dashboard =
            await getDashboardService(
                userInfo
            );

        res.status(200).json({
            success: true,
            message: "Dashboard fetched successfully",
            data: dashboard,
        });
    }
import { Request, Response } from "express";
import { getDashboardService ,getCoordinatorDashboardService,getUserDashboardService} from "../services/analytics.service.js";

export const getAdminDashboard =async (req: Request, res: Response) => {
        const userInfo = req.user;
        console.log(userInfo)
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
export const getCoordinatorDashboard =async (req: Request, res: Response) => {
        const userInfo = req.user;
        if (!userInfo) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        const dashboard =
            await getCoordinatorDashboardService(
                userInfo
            );

        res.status(200).json({
            success: true,
            message: "Dashboard fetched successfully",
            data: dashboard,
        });
    }

export const getUserDashboard =async (req: Request, res: Response) => {
        const userInfo = req.user;
        if (!userInfo) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        const dashboard =
            await getUserDashboardService(
                userInfo
            );

        res.status(200).json({
            success: true,
            message: "Dashboard fetched successfully",
            data: dashboard,
        });
    }
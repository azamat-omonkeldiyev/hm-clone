import { Request, Response } from "express";
import { sendResponse } from "../../../utils/response";
import {
    getUserCountsData,
    getTotalRevenueBySellersData,
    getTotalPropertiesCountData
} from "./stats.services";

export const DashboardStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const [userCounts, totalRevenue, totalProperties] = await Promise.all([
            getUserCountsData(),
            getTotalRevenueBySellersData(),
            getTotalPropertiesCountData()
        ]);

        const combinedStats = {
            userCounts,
            totalRevenue,
            totalProperties
        };

        sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Dashboard stats fetched successfully",
            data: combinedStats,
        });
    } catch (error) {
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to fetch dashboard stats",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

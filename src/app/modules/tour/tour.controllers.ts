import { Request, Response } from "express";
import { sendResponse } from "../../../utils/response";
import { TourSchedule } from "./tour.model";

export const scheduleTour = async (req: Request, res: Response) => {
    try {
        const { userId, propertyId, preferredDate, preferredTime, message } = req.body;

        // Basic validation
        if (!userId || !propertyId || !preferredDate || !preferredTime) {
            return sendResponse({
                res,
                statusCode: 400,
                status: "error",
                message: "Missing required fields.",
                error: "userId, propertyId, preferredDate, and preferredTime are required.",
            });
        }

        // Optional: prevent duplicate booking at same time
        const alreadyScheduled = await TourSchedule.findOne({
            user: userId,
            property: propertyId,
            preferredDate,
            preferredTime,
        });

        if (alreadyScheduled) {
            return sendResponse({
                res,
                statusCode: 409,
                status: "error",
                message: "You’ve already scheduled a tour at this time.",
                error: "Duplicate tour booking.",
            });
        }

        // Create tour schedule
        const tour = await TourSchedule.create({
            user: userId,
            property: propertyId,
            preferredDate,
            preferredTime,
            message,
        });

        return sendResponse({
            res,
            statusCode: 201,
            status: "success",
            message: "Tour scheduled successfully.",
            data: tour,
        });
    } catch (error: any) {
        console.error("Error scheduling tour:", error);

        return sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to schedule tour.",
            error: error?.message || "Internal server error.",
        });
    }
};

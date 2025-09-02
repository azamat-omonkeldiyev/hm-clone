// controllers/notification.controller.ts
import { Request, Response } from "express";
import { sendResponse } from "../../../utils/response";
import { Notification } from "./notification.model";
import mongoose from "mongoose";

// Send a global notification now or schedule it
export const createNotification = async (req: Request, res: Response) => {
    try {
        // Destructure category and userId from req.body
        const { title, message, audience, scheduledFor, category, userId } = req.body;



        const notification = new Notification({
            title,
            message,
            audience,
            category,     // <-- Add this
            userId,       // <-- And this
            scheduledFor: scheduledFor || null,
            sent: scheduledFor ? false : true,
            sentAt: scheduledFor ? null : new Date(),
        });

        await notification.save();

        sendResponse({
            res,
            statusCode: 201,
            status: "success",
            message: scheduledFor ? "Notification scheduled successfully" : "Notification sent immediately",
            data: notification,
        });
    } catch (error) {
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to send notification",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};


// View all sent or scheduled notifications
export const getNotifications = async (req: Request, res: Response) => {
    try {
        const notifications = await Notification.find().sort({ createdAt: -1 });

        sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Notifications fetched successfully",
            data: notifications,
        });
    } catch (error) {
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to fetch notifications",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

//  seller notification controller 


// Create a seller notification (immediate or scheduled)
export const createSellerNotification = async (req: Request, res: Response) => {
    try {
        const { title, message, category, userId, scheduledFor } = req.body;

        // Validate required fields
        if (!title || !message || !category || !userId) {
            return sendResponse({
                res,
                statusCode: 400,
                status: "error",
                message: "title, message, category and userId are required",
            });
        }

        // Validate category is one of allowed values (including propertyApproval)
        const validCategories = [
            "propertyAlerts",
            "newInquiries",
            "buyersMessages",
            "other",
            "propertyApproval",
        ];
        if (!validCategories.includes(category)) {
            return sendResponse({
                res,
                statusCode: 400,
                status: "error",
                message: "Invalid notification category",
            });
        }

        // Create the notification with fixed audience "seller"
        const notification = new Notification({
            title,
            message,
            category,
            userId: new mongoose.Types.ObjectId(userId),
            audience: "seller",
            scheduledFor: scheduledFor || null,
            sent: scheduledFor ? false : true,
            sentAt: scheduledFor ? null : new Date(),
        });

        await notification.save();

        sendResponse({
            res,
            statusCode: 201,
            status: "success",
            message: scheduledFor
                ? "Seller notification scheduled successfully"
                : "Seller notification sent immediately",
            data: notification,
        });
    } catch (error) {
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to create seller notification",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// Get all seller notifications for a specific user (by userId)
export const getSellerNotifications = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { category, sent } = req.query; // optional filters from query string

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return sendResponse({
                res,
                statusCode: 400,
                status: "error",
                message: "Invalid userId",
            });
        }

        // Build the filter query object
        const filter: any = {
            userId,
            audience: "seller",
        };

        if (category) {
            // category filter can be comma separated string for multiple categories
            const categories = (category as string).split(",");
            filter.category = { $in: categories };
        }

        if (sent !== undefined) {
            // sent can be 'true' or 'false' string from query
            filter.sent = sent === "true";
        }

        const notifications = await Notification.find(filter).sort({ createdAt: -1 });

        sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Seller notifications fetched successfully",
            data: notifications,
        });
    } catch (error) {
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to fetch seller notifications",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// Mark a seller notification as sent
export const markSellerNotificationAsSent = async (req: Request, res: Response) => {
    try {
        const { notificationId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(notificationId)) {
            return sendResponse({
                res,
                statusCode: 400,
                status: "error",
                message: "Invalid notificationId",
            });
        }

        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, audience: "seller" },
            { sent: true, sentAt: new Date() },
            { new: true }
        );

        if (!notification) {
            return sendResponse({
                res,
                statusCode: 404,
                status: "error",
                message: "Seller notification not found",
            });
        }

        sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Seller notification marked as sent",
            data: notification,
        });
    } catch (error) {
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to update seller notification",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// Delete a seller notification
export const deleteSellerNotification = async (req: Request, res: Response) => {
    try {
        const { notificationId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(notificationId)) {
            return sendResponse({
                res,
                statusCode: 400,
                status: "error",
                message: "Invalid notificationId",
            });
        }

        const deleted = await Notification.findOneAndDelete({
            _id: notificationId,
            audience: "seller",
        });

        if (!deleted) {
            return sendResponse({
                res,
                statusCode: 404,
                status: "error",
                message: "Seller notification not found",
            });
        }

        sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Seller notification deleted successfully",
        });
    } catch (error) {
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to delete seller notification",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};



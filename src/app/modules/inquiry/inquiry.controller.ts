import { Request, Response } from "express";
import { sendResponse } from "../../../utils/response";
import Inquiry from "./inquiry.model";
import Property from "../property/property.model"

export const createInquiry = async (req: Request, res: Response) => {
    try {
        const { property, name, email, message } = req.body;

        const inquiry = await Inquiry.create({ property, name, email, message });

        sendResponse({ res, statusCode: 201, status: 'success', message: 'Inquiry created', data: inquiry });
    } catch (error) {
        sendResponse({
            res, statusCode: 500,
            status: 'error',
            message: 'Create failed',
            error: error instanceof Error ? error.message : "Unknown error"
        }
        );
    }
};

export const getAllInquiries = async (req: Request, res: Response) => {
    try {
        const { search, status, startDate, endDate } = req.query;
        const filter: any = {};

        if (search) {
            const regex = new RegExp(search as string, 'i');
            filter.$or = [
                { name: { $regex: regex } },
                { message: { $regex: regex } },
            ];
        }

        if (status && status !== 'all') {
            filter.status = status;
        }

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate as string);
            if (endDate) filter.createdAt.$lte = new Date(endDate as string);
        }

        const inquiries = await Inquiry.find(filter)
            .populate('property', 'title propertyType')
            .populate('assignedTo', 'firstName lastName email')
            .sort({ createdAt: -1 });

        sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Inquiries fetched",
            data: inquiries
        });
    } catch (error) {
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to fetch inquiries",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

export const assignInquiry = async (req: Request, res: Response) => {
    try {
        const { inquiryId } = req.params;
        const { userId } = req.body;

        const updated = await Inquiry.findByIdAndUpdate(
            inquiryId,
            { assignedTo: userId, status: 'assigned' },
            { new: true }
        );

        if (!updated) {
            return sendResponse({ res, statusCode: 404, status: 'error', message: 'Inquiry not found' });
        }

        sendResponse({
            res,
            statusCode: 200,
            status: 'success',
            message: 'Inquiry assigned successfully',
            data: updated
        });
    } catch (error) {
        sendResponse({
            res,
            statusCode: 500,
            status: 'error',
            message: 'Assign failed',
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};


export const updateInquiryStatus = async (req: Request, res: Response) => {
    try {
        const { inquiryId } = req.params;
        const { status } = req.body;

        const inquiry = await Inquiry.findByIdAndUpdate(inquiryId, { status }, { new: true });

        if (!inquiry) {
            return sendResponse({ res, statusCode: 404, status: 'error', message: 'Inquiry not found' });
        }

        sendResponse({
            res,
            statusCode: 200,
            status: 'success',
            message: 'Status updated',
            data: inquiry
        });
    } catch (error) {
        sendResponse({
            res,
            statusCode: 500,
            status: 'error',
            message: 'Status update failed',
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

export const getInquiryById = async (req: Request, res: Response) => {
    try {
        const { inquiryId } = req.params;
        const inquiry = await Inquiry.findById(inquiryId)
            .populate('property')
            .populate('assignedTo', 'firstName lastName email');

        if (!inquiry) {
            return sendResponse({
                res,
                statusCode: 404,
                status: 'error',
                message: 'Inquiry not found'
            });
        }

        sendResponse({
            res,
            statusCode: 200,
            status: 'success',
            message: 'Fetch Successfully',
            data: inquiry
        });
    } catch (error) {
        sendResponse({
            res,
            statusCode: 500,
            status: 'error',
            message: 'Fetch failed',
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

export const getSellerInquiries = async (req: Request, res: Response) => {
    try {
        const sellerId = req.params.sellerId;

        // Query parameters
        const {
            query,            // Search term (optional)
            status,           // Inquiry status filter (optional)
            propertyType,     // Property type filter (optional)
            page = 1,
            limit = 10,
        } = req.query;

        // Step 1: Get all seller's properties with optional propertyType filter
        const propertyFilter: any = { owner: sellerId };
        if (propertyType && propertyType !== "all") {
            propertyFilter.propertyType = propertyType;
        }
        const sellerProperties = await Property.find(propertyFilter).select("_id");
        const propertyIds = sellerProperties.map((p) => p._id);

        // Step 2: Build inquiry filters
        const inquiryFilters: any = {
            property: { $in: propertyIds },
        };

        // Add status filter if provided
        if (status && status !== "all") {
            inquiryFilters.status = status;
        }




        if (query) {
            const regex = new RegExp(query as string, "i");

            // Find matching properties by title (only among seller's properties)
            const matchingProperties = await Property.find({
                _id: { $in: propertyIds },
                title: { $regex: regex },
            }).select("_id");
            const matchingPropertyIds = matchingProperties.map((p) => p._id);

            inquiryFilters.$or = [
                { name: { $regex: regex } },
                { message: { $regex: regex } },
                { property: { $in: matchingPropertyIds } },
            ];
        }

        // Pagination
        const skip = (+page - 1) * +limit;

        // Step 4: Query inquiries with populated property info
        const inquiries = await Inquiry.find(inquiryFilters)
            .populate("property", "title images propertyType")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(+limit);

        // Total count for pagination
        const total = await Inquiry.countDocuments(inquiryFilters);

        sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Seller inquiries fetched successfully",
            data: {
                inquiries,
                total,
                page: +page,
                pages: Math.ceil(total / +limit),
            },
        });
    } catch (error) {
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to fetch inquiries",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

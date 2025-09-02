import { Request, Response } from 'express';
import { sendResponse } from '../../../utils/response';
import Ticket from './ticket.model';
import mongoose from 'mongoose';

// Create a new support ticket
export const createTicket = async (req: Request, res: Response) => {
    try {
        const { subject, message, priority } = req.body;
        const user = req.user?.id; // assuming you're using middleware to attach user to req

        const ticket = new Ticket({
            user,
            subject,
            message,
            priority
        });

        await ticket.save();

        sendResponse({
            res,
            statusCode: 201,
            status: "success",
            message: "Ticket created successfully",
            data: ticket
        });
    } catch (error) {
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to create ticket",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// Get all tickets
export const getAllTickets = async (req: Request, res: Response) => {
    try {
        const tickets = await Ticket.find()
            .populate('user', 'username email')
            .sort({ createdAt: -1 });

        sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Tickets fetched successfully",
            data: tickets
        });
    } catch (error) {
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to fetch tickets",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// Get single ticket by ID
export const getTicketById = async (req: Request, res: Response) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate('user', 'username email')
            .populate('replies.user', 'username email');

        if (!ticket) {
            return sendResponse({
                res,
                statusCode: 404,
                status: "error",
                message: "Ticket not found",
            });
        }

        sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Ticket fetched successfully",
            data: ticket
        });
    } catch (error) {
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to fetch ticket",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// Update ticket status
export const updateTicketStatus = async (req: Request, res: Response) => {
    try {
        const { status } = req.body;

        const ticket = await Ticket.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!ticket) {
            return sendResponse({
                res,
                statusCode: 404,
                status: "error",
                message: "Ticket not found",
            });
        }

        sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Ticket status updated successfully",
            data: ticket
        });
    } catch (error) {
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to update ticket status",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// Reply to a ticket


export const replyToTicket = async (req: Request, res: Response) => {
    try {
        const { message } = req.body;
        const userId = req?.user?.id;

        if (!userId) {
            return sendResponse({
                res,
                statusCode: 401,
                status: "error",
                message: "Unauthorized: User ID not provided",
            });
        }

        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return sendResponse({
                res,
                statusCode: 404,
                status: "error",
                message: "Ticket not found",
            });
        }

        // Convert userId to ObjectId explicitly
        ticket.replies.push({
            user: new mongoose.Types.ObjectId(userId),
            message, createdAt: new Date(),
        });

        await ticket.save();

        sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Reply added successfully",
            data: ticket
        });
    } catch (error) {
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to add reply",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};


// Delete a ticket
export const deleteTicket = async (req: Request, res: Response) => {
    try {
        const ticket = await Ticket.findByIdAndDelete(req.params.id);

        if (!ticket) {
            return sendResponse({
                res,
                statusCode: 404,
                status: "error",
                message: "Ticket not found",
            });
        }

        sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Ticket deleted successfully",
        });
    } catch (error) {
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to delete ticket",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};


// Assign an agent to a ticket
export const assignAgentToTicket = async (req: Request, res: Response) => {
    try {
        const { agentId } = req.body;

        const ticket = await Ticket.findByIdAndUpdate(
            req.params.id,
            { assignedAgent: agentId },
            { new: true }
        ).populate('assignedAgent', 'username email');

        if (!ticket) {
            return sendResponse({
                res,
                statusCode: 404,
                status: "error",
                message: "Ticket not found",
            });
        }

        sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Agent assigned successfully",
            data: ticket
        });
    } catch (error) {
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to assign agent",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// Get tickets by status
export const getTicketsByStatus = async (req: Request, res: Response) => {
    try {
        const { status } = req.query;

        if (!status || typeof status !== 'string') {
            return sendResponse({
                res,
                statusCode: 400,
                status: "error",
                message: "Status query parameter is required",
            });
        }

        // 🧠 If status is "all", fetch everything
        const filter = status === 'all' ? {} : { status };

        const tickets = await Ticket.find(filter)
            .populate('user', 'username email')
            .populate('assignedAgent', 'username email')
            .sort({ createdAt: -1 });

        sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: `Tickets${status !== 'all' ? ` with status "${status}"` : ''} fetched successfully`,
            data: tickets
        });
    } catch (error) {
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to fetch tickets by status",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};


export const filterTickets = async (req: Request, res: Response) => {
    try {
        const { status, priority, agentId } = req.query;

        const filter: any = {};

        if (status && typeof status === 'string' && status !== 'all') {
            filter.status = status;
        }

        if (priority && typeof priority === 'string') {
            filter.priority = priority;
        }

        if (agentId && typeof agentId === 'string') {
            filter.assignedAgent = agentId;
        }

        const tickets = await Ticket.find(filter)
            .populate('user', 'username email')
            .populate('assignedAgent', 'username email')
            .sort({ createdAt: -1 });

        sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Filtered tickets fetched successfully",
            data: tickets
        });
    } catch (error) {
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to filter tickets",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};


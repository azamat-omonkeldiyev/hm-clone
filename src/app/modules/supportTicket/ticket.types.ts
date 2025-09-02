import mongoose, { Document } from "mongoose";

export interface ITicket extends Document {
    user: mongoose.Types.ObjectId;
    subject: string;
    message: string;
    status: 'open' | 'in_progress' | 'closed';
    priority: 'low' | 'medium' | 'high';
    assignedAgent?: mongoose.Types.ObjectId;
    replies: {
        user: mongoose.Types.ObjectId;
        message: string;
        createdAt: Date;
    }[];
}
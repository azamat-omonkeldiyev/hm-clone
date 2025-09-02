import mongoose, { Document } from "mongoose";

export interface INotification extends Document {
    title: string;
    message: string;
    category: 'propertyAlerts' | 'newInquiries' | 'buyersMessages' | 'other' | 'propertyApproval'; // added propertyApproval
    userId: mongoose.Types.ObjectId;
    audience: string; // e.g., 'seller', 'buyer', 'agent'
    scheduledFor?: Date;
    sent: boolean;
    sentAt?: Date;
}
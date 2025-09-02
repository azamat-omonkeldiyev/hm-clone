import mongoose, { Document } from "mongoose";

export interface ITourSchedule extends Document {
    user: mongoose.Types.ObjectId;
    property: mongoose.Types.ObjectId;
    preferredDate: Date;
    preferredTime: string; // e.g., "10:30 AM"
    message?: string;
    status: "pending" | "confirmed" | "cancelled";
}
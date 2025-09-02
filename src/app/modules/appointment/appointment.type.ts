import mongoose, { Document } from "mongoose";

export interface IAppointment extends Document {
    propertyId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    email: string;
    date: {
        day: number;
        month: number;
        year: number;
    };
    slot: string;
    status: "pending" | "confirmed" | "cancelled";
    createdAt: Date;
    updatedAt: Date;
}

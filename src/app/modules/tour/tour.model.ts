import mongoose, { Schema, Model } from "mongoose";
import { ITourSchedule } from "./tour.type";



const TourScheduleSchema = new Schema<ITourSchedule>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        property: { type: Schema.Types.ObjectId, ref: "Property", required: true },
        preferredDate: { type: Date, required: true },
        preferredTime: { type: String, required: true },
        message: { type: String },
        status: {
            type: String,
            enum: ["pending", "confirmed", "cancelled"],
            default: "pending",
        },
    },
    { timestamps: true }
);

export const TourSchedule: Model<ITourSchedule> = mongoose.model<ITourSchedule>(
    "TourSchedule",
    TourScheduleSchema
);

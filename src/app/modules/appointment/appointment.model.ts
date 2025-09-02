import mongoose, { Schema } from "mongoose";
import { IAppointment } from "./appointment.type";



const AppointmentSchema: Schema = new Schema(
    {
        propertyId: {
            type: mongoose.Types.ObjectId,
            ref: "Property",
            required: true,
        },
        userId: {
            type: mongoose.Types.ObjectId,
            ref: "User",
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        date: {
            day: { type: Number, required: true },
            month: { type: Number, required: true },
            year: { type: Number, required: true },
        },
        slot: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "confirmed", "cancelled"],
            default: "pending",
        },
    },
    { timestamps: true }
);

export default mongoose.model<IAppointment>("Appointment", AppointmentSchema);

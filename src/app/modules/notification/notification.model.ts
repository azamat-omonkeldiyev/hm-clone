import mongoose, { Schema } from "mongoose";
import { INotification } from "./notification.type";



const NotificationSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        category: {
            type: String,
            required: true,
            enum: ['propertyAlerts', 'newInquiries', 'buyersMessages', 'other', 'propertyApproval'],
        },
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        message: { type: String, required: true },
        audience: { type: String, required: true },
        scheduledFor: { type: Date },
        sent: { type: Boolean, default: false },
        sentAt: { type: Date },
    },
    { timestamps: true }
);

export const Notification = mongoose.model<INotification>("Notification", NotificationSchema);

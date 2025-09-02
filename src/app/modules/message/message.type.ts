import mongoose, { Document } from "mongoose";

export interface MessageDocument extends Document {
    _id: mongoose.Types.ObjectId;
    sender: mongoose.Schema.Types.ObjectId;
    receiver: mongoose.Schema.Types.ObjectId;
    content: string;
    subject: string;
    read: boolean;
    type: 'buyer-seller' | 'buyer-admin' | 'seller-buyer' | 'admin-buyer';
    timestamp: Date;
}
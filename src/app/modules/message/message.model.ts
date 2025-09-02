import mongoose, { Schema } from 'mongoose';
import { MessageDocument } from './message.type';

const MessageSchema = new Schema(
    {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String },
        subject: { type: String },
        read: { type: Boolean, default: false },
        type: {
            type: String,
            enum: ['buyer-seller', 'buyer-admin', 'seller-buyer', 'admin-buyer'],

        },
        timestamp: { type: Date, default: Date.now },
        parentMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
    },
    { timestamps: true }
);

const Message = mongoose.model<MessageDocument>('Message', MessageSchema);

export default Message;

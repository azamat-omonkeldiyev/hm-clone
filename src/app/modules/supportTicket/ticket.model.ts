import mongoose, { Schema } from 'mongoose';
import { ITicket } from './ticket.types';



const TicketSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'closed'],
        default: 'open'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    assignedAgent: { type: Schema.Types.ObjectId, ref: 'User', default: null }, // 👈 added for assignment
    replies: [{
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        message: { type: String },
        createdAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

export default mongoose.model<ITicket>('Ticket', TicketSchema);

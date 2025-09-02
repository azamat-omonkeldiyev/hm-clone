import mongoose, { Schema, Document } from 'mongoose';

export interface IInquiry extends Document {
    property: mongoose.Types.ObjectId;
    name: string;
    email: string;
    message: string;
    status: 'pending' | 'assigned' | 'resolved';
    assignedTo?: mongoose.Types.ObjectId;
    createdAt: Date;
}

const InquirySchema: Schema = new Schema({
    property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    name: { type: String, required: true },
    email: { type: String },
    message: { type: String },
    status: { type: String, enum: ['pending', 'assigned', 'resolved'], default: 'pending' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model<IInquiry>('Inquiry', InquirySchema);

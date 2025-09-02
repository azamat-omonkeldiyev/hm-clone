import mongoose, { Schema } from 'mongoose';
import { IPayment } from './payment.types';



const PaymentSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    status: { type: String, enum: ['approved', 'pending', 'refund'], default: 'pending' },
    transactionId: { type: String, required: true },
    paymentDate: { type: Date, required: true },
    paymentType: { type: String, enum: ['subscription', 'one-time', 'featured'], required: true }
}, { timestamps: true });

export default mongoose.model<IPayment>('Payment', PaymentSchema);

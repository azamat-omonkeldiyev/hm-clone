import mongoose, { Document } from 'mongoose';
export interface IPayment extends Document {
    user: mongoose.Types.ObjectId; // Reference to the user who made the payment
    amount: number;
    paymentMethod: string;
    status: 'approved' | 'pending' | 'refund';
    transactionId: string;
    paymentDate: Date;
    paymentType: 'subscription' | 'one-time' | 'featured'; // Additional info on the type of payment
}
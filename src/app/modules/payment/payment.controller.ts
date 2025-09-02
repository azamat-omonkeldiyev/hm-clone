import { Request, Response } from "express";
import { sendResponse } from "../../../utils/response";
import Payment from "./payment.model"


export const createPayment = async (req: Request, res: Response) => {
    try {
        const { userId, amount, paymentMethod, paymentType, transactionId, status } = req.body;

        const payment = new Payment({
            user: userId,
            amount,
            paymentMethod,
            paymentType,
            transactionId,
            status: status || 'pending', // Default to pending status
            paymentDate: new Date()
        });

        await payment.save();

        sendResponse({
            res,
            statusCode: 201,
            status: 'success',
            message: 'Payment created successfully',
            data: payment
        });
    } catch (error) {
        sendResponse({
            res,
            statusCode: 500,
            status: 'error',
            message: 'Failed to create payment',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const getAllPayments = async (req: Request, res: Response) => {
    try {
        const { status, paymentType, userId, page = 1, limit = 10 } = req.query;

        const filter: any = {};

        if (status) filter.status = status;
        if (paymentType) filter.paymentType = paymentType;
        if (userId) filter.user = userId;

        const skip = (Number(page) - 1) * Number(limit);

        const payments = await Payment.find(filter)
            .populate('user', 'name email')
            .sort({ paymentDate: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Payment.countDocuments(filter);

        sendResponse({
            res,
            statusCode: 200,
            status: 'success',
            message: 'Payments fetched successfully',
            data: {
                payments,
                total,
                page,
                limit
            }
        });
    } catch (error) {
        sendResponse({
            res,
            statusCode: 500,
            status: 'error',
            message: 'Failed to fetch payments',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const getPaymentDetails = async (req: Request, res: Response) => {
    try {
        const { paymentId } = req.params;

        const payment = await Payment.findById(paymentId).populate('user', 'name email');

        if (!payment) {
            return sendResponse({
                res,
                statusCode: 404,
                status: 'error',
                message: 'Payment not found'
            });
        }

        sendResponse({
            res,
            statusCode: 200,
            status: 'success',
            message: 'Payment details fetched successfully',
            data: payment
        });
    } catch (error) {
        sendResponse({
            res,
            statusCode: 500,
            status: 'error',
            message: 'Failed to fetch payment details',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const refundPayment = async (req: Request, res: Response) => {
    try {
        const { paymentId } = req.params;

        const updatedPayment = await Payment.findByIdAndUpdate(
            paymentId,
            { status: 'refund' },
            { new: true }
        );

        if (!updatedPayment) {
            return sendResponse({
                res,
                statusCode: 404,
                status: 'error',
                message: 'Payment not found'
            });
        }

        sendResponse({
            res,
            statusCode: 200,
            status: 'success',
            message: 'Payment refunded successfully',
            data: updatedPayment
        });
    } catch (error) {
        sendResponse({
            res,
            statusCode: 500,
            status: 'error',
            message: 'Failed to refund payment',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};




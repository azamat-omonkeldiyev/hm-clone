import express from "express"
import { createPayment, getAllPayments, getPaymentDetails, refundPayment } from "./payment.controller";

const router = express.Router();

router.post('/', createPayment);
router.get('/', getAllPayments);
router.get('/:paymentId', getPaymentDetails);
router.put('/:paymentId/refund', refundPayment);

export default router
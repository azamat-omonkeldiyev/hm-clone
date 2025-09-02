import express from "express";
import { assignInquiry, createInquiry, getAllInquiries, getInquiryById, getSellerInquiries, updateInquiryStatus } from "./inquiry.controller";
const router = express.Router()
router.post('/', createInquiry);
router.get('/', getAllInquiries);
// seller app
router.get('/:sellerId/search', getSellerInquiries);

router.get('/:inquiryId', getInquiryById);
router.put('/:inquiryId/assign', assignInquiry);
router.put('/:inquiryId/status', updateInquiryStatus);

export default router

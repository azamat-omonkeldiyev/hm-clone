
import { Router } from "express";
import { createNotification, getNotifications, getSellerNotifications } from "./notification.controllers";
import { verifyToken, verifyTokenAndUserMatch } from "../../middleware/auth.middleware";

const router = Router();

router.post("/", verifyToken, createNotification);
router.get("/", verifyToken, getNotifications);
router.get("/:userId/seller", verifyToken, verifyTokenAndUserMatch, getSellerNotifications);

export default router;

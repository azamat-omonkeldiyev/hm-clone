import express from "express"
import { DashboardStats } from "./stats.controllers";
const router = express.Router();


router.get("/", DashboardStats);

export default router;
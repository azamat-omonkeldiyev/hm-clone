import express from "express";
import { scheduleTour } from "./tour.controllers";


const router = express.Router();

router.post("/schedule", scheduleTour);

export default router;

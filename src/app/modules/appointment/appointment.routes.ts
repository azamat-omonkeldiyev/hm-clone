import { Router } from "express";

import {
    createAppointment,
    getAppointmentsByProperty,
    getBookedSlots,
    getAllAppointments,
    updateAppointmentStatus,
    deleteAppointment,
} from "./appointment.controller";

const router = Router();

router.post("/", createAppointment);
router.get("/", getAllAppointments);
router.get("/:propertyId", getAppointmentsByProperty);
router.get("/booked-slots/:propertyId", getBookedSlots);
router.put("/:id/status", updateAppointmentStatus);
router.delete("/:id", deleteAppointment);

export default router;

import { Request, Response } from "express";
import appointmentModel from "./appointment.model";
import { sendResponse } from "../../../utils/response";


// Create a new appointment
export const createAppointment = async (req: Request, res: Response) => {
    const { propertyId, userId, email, date, slot } = req.body;

    try {
        // Check if the slot is already booked
        const existingAppointment = await appointmentModel.findOne({
            propertyId,
            "date.day": date.day,
            "date.month": date.month,
            "date.year": date.year,
            slot,
        });

        if (existingAppointment) {
            return res.status(400).json({ message: "Slot is already booked." });
        }

        // Create new appointment
        const newAppointment = new appointmentModel({
            propertyId,
            userId,
            email,
            date,
            slot,
        });

        await newAppointment.save();

        res.status(201).json({ message: "Appointment created successfully.", newAppointment });
    } catch (error) {
        console.error("Error creating appointment:", error);
        res.status(500).json({ message: "Failed to create appointment." });
    }
};

// Get all appointments for a property
export const getAppointmentsByProperty = async (req: Request, res: Response) => {
    const { propertyId } = req.params;

    try {
        const appointments = await appointmentModel.find({ propertyId });

        res.status(200).json({ appointments });
    } catch (error) {
        console.error("Error fetching appointments:", error);
        res.status(500).json({ message: "Failed to fetch appointments." });
    }
};

// Get booked slots for a specific property and date
export const getBookedSlots = async (req: Request, res: Response) => {
    const { propertyId } = req.params;
    const { day, month, year } = req.query;

    try {
        const bookedSlots = await appointmentModel.find({
            propertyId,
            "date.day": Number(day),
            "date.month": Number(month),
            "date.year": Number(year),
        }).select("slot");

        res.status(200).json({ bookedSlots: bookedSlots.map((slot) => slot.slot) });
    } catch (error) {
        console.error("Error fetching booked slots:", error);
        res.status(500).json({ message: "Failed to fetch booked slots." });
    }
};

// Update appointment status (confirmed, pending, canceled)
export const updateAppointmentStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status value
    if (!["confirmed", "pending", "canceled"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value." });
    }

    try {
        // Find and update the appointment status
        const appointment = await appointmentModel.findByIdAndUpdate(
            id,
            { status },
            { new: true } // Return the updated appointment
        );

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found." });
        }

        // Return the updated appointment
        res.status(200).json({
            message: "Appointment status updated successfully.",
            appointment,
        });
    } catch (error) {
        console.error("Error updating appointment status:", error);
        res.status(500).json({ message: "Failed to update appointment status." });
    }
};




// admin 

export const getAllAppointments = async (req: Request, res: Response) => {


    try {
        // Build the filter object based on provided query parameters





        // Fetch the filtered appointments
        const appointments = await appointmentModel.find().populate("propertyId", "title").populate("userId", "firstName lastName");

        // If no appointments found
        if (appointments.length === 0) {
            return sendResponse({
                res,
                statusCode: 404,
                status: "error",
                message: "No appointments found matching the given criteria",
                data: null,
            });
        }

        // Return the appointments
        return sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Fetched appointments successfully",
            data: appointments,
        });
    } catch (error) {
        console.error("Error fetching appointments:", error);
        return sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to fetch appointments",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// Delete an appointment
export const deleteAppointment = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        // Find and delete the appointment by ID
        const appointment = await appointmentModel.findByIdAndDelete(id);

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found." });
        }

        return sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Appointment deleted successfully",
            data: appointment,
        });
    } catch (error) {
        console.error("Error deleting appointment:", error);
        return sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to delete appointment",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};



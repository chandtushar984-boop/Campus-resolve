import crypto from "node:crypto";
import mongoose from "mongoose";
import Event from "../models/event.model.js";
import EventRegistration, {
    ATTENDANCE_STATUSES,
} from "../models/eventRegistration.model.js";
import User from "../models/user.model.js";
import { canManageEvent } from "./event.controller.js";
import { createNotification } from "../services/notification.service.js";
import { sendRegistrationConfirmationEmail } from "../services/email.service.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const generateTicketCode = () =>
    `TKT-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;

const getMyRegistrationForEvent = async (req, res) => {
    try {
        const { id: eventId } = req.params;
        if (!isValidObjectId(eventId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID.",
            });
        }

        const registration = await EventRegistration.findOne({
            event: eventId,
            student: req.user.userId,
            status: "Registered",
        }).lean();

        return res.status(200).json({
            success: true,
            registration: registration || null,
        });
    } catch {
        return res.status(500).json({
            success: false,
            message: "Failed to check registration status.",
        });
    }
};

const registerForEvent = async (req, res) => {
    try {
        const { id: eventId } = req.params;
        if (!isValidObjectId(eventId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID.",
            });
        }

        const existingActive = await EventRegistration.findOne({
            event: eventId,
            student: req.user.userId,
            status: "Registered",
        }).lean();

        if (existingActive) {
            return res.status(409).json({
                success: false,
                message: "You are already registered for this event.",
            });
        }

        const now = new Date();

        // Atomically reserve a seat only if the event is approved,
        // before registrationDeadline and endDateTime, and has open capacity.
        const reservedEvent = await Event.findOneAndUpdate(
            {
                _id: eventId,
                approvalStatus: "Approved",
                registrationDeadline: { $gte: now },
                endDateTime: { $gt: now },
                $expr: { $lt: ["$registeredCount", "$seatCapacity"] },
            },
            { $inc: { registeredCount: 1 } },
            { new: true }
        );

        if (!reservedEvent) {
            const existingEvent = await Event.findById(eventId).lean();
            if (!existingEvent) {
                return res.status(404).json({
                    success: false,
                    message: "Event not found.",
                });
            }
            if (existingEvent.approvalStatus !== "Approved") {
                return res.status(400).json({
                    success: false,
                    message: "Registration is only open for approved events.",
                });
            }
            if (now > new Date(existingEvent.endDateTime)) {
                return res.status(400).json({
                    success: false,
                    message: "This event has already ended.",
                });
            }
            if (now > new Date(existingEvent.registrationDeadline)) {
                return res.status(400).json({
                    success: false,
                    message: "Registration deadline has passed.",
                });
            }
            return res.status(409).json({
                success: false,
                message: "Event is full. All seats are filled.",
            });
        }

        let registration;
        try {
            registration = await EventRegistration.create({
                event: eventId,
                student: req.user.userId,
                ticketCode: generateTicketCode(),
                status: "Registered",
                attendanceStatus: "Registered",
                registeredAt: now,
            });
        } catch (err) {
            // Release the reserved seat if registration creation fails (e.g. concurrent duplicate)
            await Event.updateOne(
                { _id: eventId, registeredCount: { $gt: 0 } },
                { $inc: { registeredCount: -1 } }
            );

            if (err?.code === 11000) {
                return res.status(409).json({
                    success: false,
                    message: "You are already registered for this event.",
                });
            }

            return res.status(500).json({
                success: false,
                message: "Failed to complete event registration.",
            });
        }

        try {
            if (mongoose.connection.readyState === 1) {
                await createNotification({
                    recipient: req.user.userId,
                    type: "registration_confirmed",
                    title: "Registration Confirmed",
                    message: `You are registered for "${reservedEvent.title || "the event"}". Ticket: ${registration.ticketCode}`,
                    link: "/student/my-tickets",
                    relatedEvent: eventId,
                    relatedClub: reservedEvent.club || null,
                });

                const student = await User.findById(req.user.userId)
                    .select("name email")
                    .lean();
                if (student?.email) {
                    await sendRegistrationConfirmationEmail({
                        to: student.email,
                        studentName: student.name,
                        eventTitle: reservedEvent.title || "Campus Event",
                        venue: reservedEvent.venue || "TBA",
                        startDateTime: reservedEvent.startDateTime,
                        ticketCode: registration.ticketCode,
                    });
                }
            }
        } catch {
            // Notification/email failure must not undo registration
        }

        return res.status(201).json({
            success: true,
            message: "Successfully registered for the event.",
            registration,
            seatSummary: {
                registeredCount: reservedEvent.registeredCount,
                seatCapacity: reservedEvent.seatCapacity,
            },
        });
    } catch {
        return res.status(500).json({
            success: false,
            message: "Failed to register for event.",
        });
    }
};

const cancelRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid registration ID.",
            });
        }

        const registration = await EventRegistration.findById(id);
        if (!registration) {
            return res.status(404).json({
                success: false,
                message: "Registration not found.",
            });
        }

        if (registration.student.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You can only cancel your own registration.",
            });
        }

        if (registration.status === "Cancelled") {
            return res.status(400).json({
                success: false,
                message: "Registration is already cancelled.",
            });
        }

        if (registration.attendanceStatus === "Attended") {
            return res.status(400).json({
                success: false,
                message: "Cannot cancel registration after check-in.",
            });
        }

        const event = await Event.findById(registration.event).lean();
        if (event && event.approvalStatus === "Approved") {
            const now = new Date();
            if (now >= new Date(event.startDateTime)) {
                return res.status(400).json({
                    success: false,
                    message: "Cancellation is not permitted once the event has started.",
                });
            }
        }

        const updated = await EventRegistration.findOneAndUpdate(
            {
                _id: id,
                student: req.user.userId,
                status: "Registered",
                attendanceStatus: { $ne: "Attended" },
            },
            {
                $set: {
                    status: "Cancelled",
                    cancelledAt: new Date(),
                },
            },
            { new: true }
        );

        if (!updated) {
            return res.status(409).json({
                success: false,
                message: "Registration could not be cancelled.",
            });
        }

        await Event.updateOne(
            { _id: registration.event, registeredCount: { $gt: 0 } },
            { $inc: { registeredCount: -1 } }
        );

        return res.status(200).json({
            success: true,
            message: "Registration cancelled and seat released.",
            registration: updated,
        });
    } catch {
        return res.status(500).json({
            success: false,
            message: "Failed to cancel registration.",
        });
    }
};

const getMyTickets = async (req, res) => {
    try {
        const tickets = await EventRegistration.find({
            student: req.user.userId,
        })
            .populate({
                path: "event",
                select: "title venue startDateTime endDateTime registrationDeadline seatCapacity registeredCount approvalStatus category posterImage club",
                populate: { path: "club", select: "name category" },
            })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            tickets,
        });
    } catch {
        return res.status(500).json({
            success: false,
            message: "Failed to load your tickets.",
        });
    }
};

const getEventRegistrations = async (req, res) => {
    try {
        const { id: eventId } = req.params;
        if (!isValidObjectId(eventId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID.",
            });
        }

        const event = await Event.findById(eventId)
            .populate("club", "name clubHead coHead")
            .lean();

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found.",
            });
        }

        if (!canManageEvent(event.club, req.user)) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You can only view registrations for your assigned club's events.",
            });
        }

        const registrations = await EventRegistration.find({ event: eventId })
            .populate("student", "name email rollNo course semester")
            .populate("checkedInBy", "name role")
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            event,
            registrations,
        });
    } catch {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch event registrations.",
        });
    }
};

const verifyTicket = async (req, res) => {
    try {
        const { id: eventId } = req.params;
        const rawCode = req.body?.ticketCode;
        const ticketCode = rawCode ? String(rawCode).trim().toUpperCase() : "";

        if (!isValidObjectId(eventId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID.",
            });
        }

        if (!ticketCode) {
            return res.status(400).json({
                success: false,
                message: "Ticket identifier is required.",
            });
        }

        const event = await Event.findById(eventId)
            .populate("club", "name clubHead coHead")
            .lean();

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found.",
            });
        }

        if (!canManageEvent(event.club, req.user)) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You are not authorized to verify tickets for this event.",
            });
        }

        if (event.approvalStatus !== "Approved") {
            return res.status(400).json({
                success: false,
                message: "Tickets can only be verified for approved events.",
            });
        }

        const registration = await EventRegistration.findOne({ ticketCode })
            .populate("student", "name email rollNo course semester")
            .lean();

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found.",
            });
        }

        if (registration.event.toString() !== eventId) {
            return res.status(400).json({
                success: false,
                message: "Ticket does not belong to this event.",
            });
        }

        if (registration.status !== "Registered") {
            return res.status(400).json({
                success: false,
                message: "This registration has been cancelled and is no longer valid.",
            });
        }

        if (registration.attendanceStatus === "Attended") {
            return res.status(409).json({
                success: false,
                message: "Ticket has already been checked in.",
            });
        }

        const checkedIn = await EventRegistration.findOneAndUpdate(
            {
                _id: registration._id,
                event: eventId,
                status: "Registered",
                attendanceStatus: { $ne: "Attended" },
            },
            {
                $set: {
                    attendanceStatus: "Attended",
                    checkedInAt: new Date(),
                    checkedInBy: req.user.userId,
                },
            },
            { new: true }
        )
            .populate("student", "name email rollNo course semester")
            .populate("checkedInBy", "name role");

        if (!checkedIn) {
            return res.status(409).json({
                success: false,
                message: "Ticket has already been checked in.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Ticket verified and student checked in.",
            registration: checkedIn,
        });
    } catch {
        return res.status(500).json({
            success: false,
            message: "Failed to verify ticket.",
        });
    }
};

const markAttendance = async (req, res) => {
    try {
        const { id: eventId, registrationId } = req.params;
        const { attendanceStatus } = req.body;

        if (!isValidObjectId(eventId) || !isValidObjectId(registrationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid event or registration ID.",
            });
        }

        if (!ATTENDANCE_STATUSES.includes(attendanceStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid attendance status.",
            });
        }

        const event = await Event.findById(eventId)
            .populate("club", "name clubHead coHead")
            .lean();

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found.",
            });
        }

        if (!canManageEvent(event.club, req.user)) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You are not authorized to record attendance for this event.",
            });
        }

        const registration = await EventRegistration.findOne({
            _id: registrationId,
            event: eventId,
        });

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: "Registration not found for this event.",
            });
        }

        if (registration.status !== "Registered") {
            return res.status(400).json({
                success: false,
                message: "Cannot record attendance for a cancelled registration.",
            });
        }

        if (registration.attendanceStatus === "Attended") {
            return res.status(409).json({
                success: false,
                message: "Student has already been checked in and attendance cannot be modified.",
            });
        }

        const updateFields =
            attendanceStatus === "Attended"
                ? {
                      attendanceStatus: "Attended",
                      checkedInAt: new Date(),
                      checkedInBy: req.user.userId,
                  }
                : {
                      attendanceStatus,
                      checkedInAt: null,
                      checkedInBy: null,
                  };

        const updated = await EventRegistration.findOneAndUpdate(
            {
                _id: registrationId,
                event: eventId,
                status: "Registered",
                attendanceStatus: { $ne: "Attended" },
            },
            { $set: updateFields },
            { new: true }
        )
            .populate("student", "name email rollNo course semester")
            .populate("checkedInBy", "name role");

        if (!updated) {
            return res.status(409).json({
                success: false,
                message: "Student has already been checked in and attendance cannot be modified.",
            });
        }

        return res.status(200).json({
            success: true,
            message: `Attendance marked as ${attendanceStatus}.`,
            registration: updated,
        });
    } catch {
        return res.status(500).json({
            success: false,
            message: "Failed to update attendance.",
        });
    }
};

const escapeCsvField = (value) => {
    let str = value === null || value === undefined ? "" : String(value);
    if (/^[=+\-@\t\r]/.test(str)) {
        str = `'${str}`;
    }
    return `"${str.replace(/"/g, '""')}"`;
};

const exportEventRegistrationsCsv = async (req, res) => {
    try {
        const { id: eventId } = req.params;
        if (!isValidObjectId(eventId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID.",
            });
        }

        const event = await Event.findById(eventId)
            .populate("club", "name clubHead coHead")
            .lean();

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found.",
            });
        }

        if (!canManageEvent(event.club, req.user)) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You can only export registrations for your assigned club's events.",
            });
        }

        const registrations = await EventRegistration.find({
            event: eventId,
            status: "Registered",
        })
            .populate("student", "name email rollNo")
            .sort({ registeredAt: 1 })
            .lean();

        const headers = [
            "Student Name",
            "University Email",
            "Roll Number",
            "Registration Date",
            "Attendance Status",
        ];

        const rows = registrations.map((reg) => {
            const regDate = reg.registeredAt
                ? new Date(reg.registeredAt).toISOString()
                : "";
            return [
                escapeCsvField(reg.student?.name || ""),
                escapeCsvField(reg.student?.email || ""),
                escapeCsvField(reg.student?.rollNo || ""),
                escapeCsvField(regDate),
                escapeCsvField(reg.attendanceStatus || "Registered"),
            ].join(",");
        });

        const csvContent = [headers.map(escapeCsvField).join(","), ...rows].join(
            "\r\n"
        );

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="event-${eventId}-registrations.csv"`
        );
        return res.status(200).send(csvContent);
    } catch {
        return res.status(500).json({
            success: false,
            message: "Failed to export registrations CSV.",
        });
    }
};

export {
    getMyRegistrationForEvent,
    registerForEvent,
    cancelRegistration,
    getMyTickets,
    getEventRegistrations,
    verifyTicket,
    markAttendance,
    escapeCsvField,
    exportEventRegistrationsCsv,
};

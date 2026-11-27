import mongoose from "mongoose";

export const REGISTRATION_STATUSES = ["Registered", "Cancelled"];
export const ATTENDANCE_STATUSES = ["Registered", "Attended", "Absent"];

const eventRegistrationSchema = new mongoose.Schema(
    {
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true,
        },
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        ticketCode: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        status: {
            type: String,
            enum: REGISTRATION_STATUSES,
            default: "Registered",
        },
        attendanceStatus: {
            type: String,
            enum: ATTENDANCE_STATUSES,
            default: "Registered",
        },
        registeredAt: {
            type: Date,
            default: Date.now,
        },
        checkedInAt: {
            type: Date,
            default: null,
        },
        checkedInBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        cancelledAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

// Prevent duplicate active registrations for the same student and event
// while allowing a student who cancelled to re-register if seats are available.
eventRegistrationSchema.index(
    { event: 1, student: 1 },
    {
        unique: true,
        partialFilterExpression: { status: "Registered" },
    }
);
eventRegistrationSchema.index({ event: 1, status: 1 });
eventRegistrationSchema.index({ student: 1, createdAt: -1 });

const EventRegistration = mongoose.model(
    "EventRegistration",
    eventRegistrationSchema
);

export default EventRegistration;

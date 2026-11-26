import mongoose from "mongoose";

export const EVENT_CATEGORIES = [
    "Technical",
    "Cultural",
    "Sports",
    "Workshop",
    "Seminar",
    "Competition",
    "Social",
    "Other",
];

export const APPROVAL_STATUSES = [
    "Pending",
    "Approved",
    "Rejected",
    "Cancelled",
];

const eventSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: String,
            required: true,
            enum: EVENT_CATEGORIES,
        },
        posterImage: {
            type: String,
            default: "",
            trim: true,
        },
        venue: {
            type: String,
            required: true,
            trim: true,
        },
        startDateTime: {
            type: Date,
            required: true,
        },
        endDateTime: {
            type: Date,
            required: true,
        },
        registrationDeadline: {
            type: Date,
            required: true,
        },
        seatCapacity: {
            type: Number,
            required: true,
            min: 1,
        },
        club: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Club",
            required: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        approvalStatus: {
            type: String,
            enum: APPROVAL_STATUSES,
            default: "Pending",
        },
        rejectionReason: {
            type: String,
            default: "",
            trim: true,
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        reviewedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

eventSchema.index({ venue: 1, approvalStatus: 1, startDateTime: 1, endDateTime: 1 });
eventSchema.index({ club: 1, approvalStatus: 1 });

const Event = mongoose.model("Event", eventSchema);

export default Event;

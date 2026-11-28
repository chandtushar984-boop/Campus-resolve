import mongoose from "mongoose";

export const NOTIFICATION_TYPES = [
    "event_approved",
    "event_rejected",
    "registration_confirmed",
    "event_cancelled",
    "club_announcement",
];

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: NOTIFICATION_TYPES,
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        link: {
            type: String,
            default: "",
            trim: true,
        },
        relatedEvent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            default: null,
        },
        relatedClub: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Club",
            default: null,
        },
        relatedAnnouncement: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ClubAnnouncement",
            default: null,
        },
        read: {
            type: Boolean,
            default: false,
        },
        readAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;

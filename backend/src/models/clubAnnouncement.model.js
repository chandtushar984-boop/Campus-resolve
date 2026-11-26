import mongoose from "mongoose";

const clubAnnouncementSchema = new mongoose.Schema(
    {
        club: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Club",
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        isPinned: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const ClubAnnouncement = mongoose.model(
    "ClubAnnouncement",
    clubAnnouncementSchema
);

export default ClubAnnouncement;

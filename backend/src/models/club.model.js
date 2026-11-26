import mongoose from "mongoose";

export const CLUB_CATEGORIES = [
    "Technical",
    "Cultural",
    "Sports",
    "Literary",
    "Social",
    "Academic",
    "Other",
];

const clubSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
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
            enum: CLUB_CATEGORIES,
        },
        logo: {
            type: String,
            default: "",
            trim: true,
        },
        clubHead: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

const Club = mongoose.model("Club", clubSchema);

export default Club;

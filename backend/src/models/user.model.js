import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },

        password: {
            type: String,
            required: true,
        },

        // sparse: true allows multiple documents without rollNo
        rollNo: {
            type: String,
            sparse: true,
            unique: true,
            trim: true,
        },

        course: {
            type: String,
            trim: true,
        },

        semester: {
            type: String,
            trim: true,
        },

        role: {
            type: String,
            enum: ["student", "club_head", "faculty", "admin"],
            default: "student",
        },

        managedClub: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Club",
            default: null,
        },

        isDemo: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;

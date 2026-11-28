import mongoose from "mongoose";

const eventReviewSchema = new mongoose.Schema(
    {
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true,
        },
        club: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Club",
            required: true,
        },
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },
    },
    { timestamps: true }
);

// Prevent duplicate reviews for the same event by the same student
eventReviewSchema.index({ event: 1, student: 1 }, { unique: true });
eventReviewSchema.index({ club: 1 });
eventReviewSchema.index({ event: 1, createdAt: -1 });

const EventReview = mongoose.model("EventReview", eventReviewSchema);

export default EventReview;

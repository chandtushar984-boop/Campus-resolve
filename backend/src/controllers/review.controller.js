import mongoose from "mongoose";
import Event from "../models/event.model.js";
import EventRegistration from "../models/eventRegistration.model.js";
import EventReview from "../models/eventReview.model.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const roundRating = (value) =>
    typeof value === "number" && !Number.isNaN(value)
        ? Math.round(value * 100) / 100
        : null;

const getEventRatingsMap = async (eventIds) => {
    const validIds = (eventIds || [])
        .filter((id) => isValidObjectId(id))
        .map((id) => new mongoose.Types.ObjectId(id));

    if (validIds.length === 0) {
        return new Map();
    }

    const rows = await EventReview.aggregate([
        { $match: { event: { $in: validIds } } },
        {
            $group: {
                _id: "$event",
                averageRating: { $avg: "$rating" },
                reviewCount: { $sum: 1 },
            },
        },
    ]);

    return new Map(
        rows.map((row) => [
            row._id.toString(),
            {
                averageRating: roundRating(row.averageRating),
                reviewCount: row.reviewCount,
            },
        ])
    );
};

const getClubRatingsMap = async (clubIds) => {
    const validIds = (clubIds || [])
        .filter((id) => isValidObjectId(id))
        .map((id) => new mongoose.Types.ObjectId(id));

    if (validIds.length === 0) {
        return new Map();
    }

    // Weighted club rating across all reviews of the club's events:
    // Sum of all review ratings / total review count = weighted average by event review count
    const rows = await EventReview.aggregate([
        { $match: { club: { $in: validIds } } },
        {
            $group: {
                _id: "$club",
                averageRating: { $avg: "$rating" },
                reviewCount: { $sum: 1 },
            },
        },
    ]);

    return new Map(
        rows.map((row) => [
            row._id.toString(),
            {
                averageRating: roundRating(row.averageRating),
                reviewCount: row.reviewCount,
            },
        ])
    );
};

const evaluateReviewEligibility = async (event, userId) => {
    if (!event) {
        return { canReview: false, reason: "Event not found." };
    }
    if (event.approvalStatus !== "Approved") {
        return {
            canReview: false,
            reason: "Reviews are only enabled for approved events.",
        };
    }
    if (new Date() <= new Date(event.endDateTime)) {
        return {
            canReview: false,
            reason: "Reviews open after the event has ended.",
        };
    }

    const registration = await EventRegistration.findOne({
        event: event._id,
        student: userId,
        status: "Registered",
    }).lean();

    if (!registration) {
        return {
            canReview: false,
            reason: "Only students who registered for this event can submit a review.",
        };
    }

    if (registration.attendanceStatus !== "Attended") {
        return {
            canReview: false,
            reason: "Only students marked as attended can submit a review.",
        };
    }

    const existingReview = await EventReview.findOne({
        event: event._id,
        student: userId,
    }).lean();

    if (existingReview) {
        return {
            canReview: false,
            hasReviewed: true,
            myReview: existingReview,
            reason: "You have already reviewed this event.",
        };
    }

    return { canReview: true, hasReviewed: false, myReview: null, reason: "" };
};

const submitEventReview = async (req, res) => {
    try {
        const { id: eventId } = req.params;
        const { rating, comment } = req.body;

        if (!isValidObjectId(eventId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID.",
            });
        }

        const parsedRating = Number(rating);
        if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
            return res.status(400).json({
                success: false,
                message: "Rating must be an integer between 1 and 5.",
            });
        }

        const trimmedComment = comment ? String(comment).trim() : "";
        if (!trimmedComment) {
            return res.status(400).json({
                success: false,
                message: "A written review comment is required.",
            });
        }

        if (trimmedComment.length > 1000) {
            return res.status(400).json({
                success: false,
                message: "Review comment must not exceed 1000 characters.",
            });
        }

        const event = await Event.findById(eventId).lean();
        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found.",
            });
        }

        if (event.approvalStatus !== "Approved") {
            return res.status(400).json({
                success: false,
                message: "Reviews can only be submitted for approved events.",
            });
        }

        if (new Date() <= new Date(event.endDateTime)) {
            return res.status(400).json({
                success: false,
                message: "You can only submit a review after the event has ended.",
            });
        }

        const registration = await EventRegistration.findOne({
            event: eventId,
            student: req.user.userId,
            status: "Registered",
        }).lean();

        if (!registration) {
            return res.status(403).json({
                success: false,
                message: "Only students who registered for this event can submit a review.",
            });
        }

        if (registration.attendanceStatus !== "Attended") {
            return res.status(403).json({
                success: false,
                message: "Only students marked as attended can submit a review.",
            });
        }

        const existingReview = await EventReview.findOne({
            event: eventId,
            student: req.user.userId,
        }).lean();

        if (existingReview) {
            return res.status(409).json({
                success: false,
                message: "You have already reviewed this event.",
            });
        }

        let created;
        try {
            created = await EventReview.create({
                event: eventId,
                club: event.club,
                student: req.user.userId,
                rating: parsedRating,
                comment: trimmedComment,
            });
        } catch (err) {
            if (err?.code === 11000) {
                return res.status(409).json({
                    success: false,
                    message: "You have already reviewed this event.",
                });
            }
            return res.status(500).json({
                success: false,
                message: "Failed to submit review.",
            });
        }

        const populated = await EventReview.findById(created._id)
            .populate("student", "name rollNo course")
            .lean();

        const ratingsMap = await getEventRatingsMap([eventId]);
        const ratingSummary = ratingsMap.get(eventId) || {
            averageRating: parsedRating,
            reviewCount: 1,
        };

        return res.status(201).json({
            success: true,
            message: "Review submitted successfully.",
            review: populated,
            ratingSummary,
        });
    } catch {
        return res.status(500).json({
            success: false,
            message: "Failed to submit review.",
        });
    }
};

const getEventReviews = async (req, res) => {
    try {
        const { id: eventId } = req.params;
        if (!isValidObjectId(eventId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID.",
            });
        }

        const event = await Event.findById(eventId).lean();
        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found.",
            });
        }

        if (event.approvalStatus !== "Approved" && !req.user?.userId) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Reviews are only available for approved events.",
            });
        }

        const studentSelect = req.user?.userId ? "name rollNo course" : "name";

        const [reviews, ratingsMap] = await Promise.all([
            EventReview.find({ event: eventId })
                .populate("student", studentSelect)
                .sort({ createdAt: -1 })
                .lean(),
            getEventRatingsMap([eventId]),
        ]);

        const ratingSummary = ratingsMap.get(eventId) || {
            averageRating: null,
            reviewCount: 0,
        };

        let eligibility = null;
        if (req.user?.role === "student") {
            eligibility = await evaluateReviewEligibility(event, req.user.userId);
        }

        return res.status(200).json({
            success: true,
            reviews,
            ratingSummary,
            eligibility,
        });
    } catch {
        return res.status(500).json({
            success: false,
            message: "Failed to load event reviews.",
        });
    }
};

export {
    getEventRatingsMap,
    getClubRatingsMap,
    submitEventReview,
    getEventReviews,
};

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import Event, { APPROVAL_STATUSES, EVENT_CATEGORIES } from "../models/event.model.js";
import Club from "../models/club.model.js";
import { isClubOrganizerRole, isFacultyRole } from "../middleware/role.middleware.js";

const MAX_POSTER_BYTES = 2 * 1024 * 1024; // 2 MB

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const detectImageExtension = (buffer) => {
    if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;

    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return "jpg";
    }
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47
    ) {
        return "png";
    }
    // GIF: GIF8
    if (
        buffer[0] === 0x47 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x38
    ) {
        return "gif";
    }
    // WEBP: RIFF....WEBP
    if (
        buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
        buffer.subarray(8, 12).toString("ascii") === "WEBP"
    ) {
        return "webp";
    }

    return null;
};

const resolveOrganizerClub = async (userId) => {
    return Club.findOne({
        $or: [{ clubHead: userId }, { coHead: userId }],
    });
};

const canManageEvent = (club, user) => {
    if (!club || !user) return false;
    if (isFacultyRole(user.role)) return true;
    if (isClubOrganizerRole(user.role)) {
        const isHead = club.clubHead && club.clubHead.toString() === user.userId;
        const isCoHead = club.coHead && club.coHead.toString() === user.userId;
        return Boolean(isHead || isCoHead);
    }
    return false;
};

const validateEventPayload = (body) => {
    const {
        title,
        description,
        category,
        venue,
        startDateTime,
        endDateTime,
        registrationDeadline,
        seatCapacity,
    } = body;

    if (
        !title ||
        !description ||
        !category ||
        !venue ||
        !startDateTime ||
        !endDateTime ||
        !registrationDeadline ||
        seatCapacity === undefined ||
        seatCapacity === null ||
        seatCapacity === ""
    ) {
        return { error: "All required event fields must be provided." };
    }

    if (!String(title).trim() || !String(description).trim() || !String(venue).trim()) {
        return { error: "Title, description, and venue cannot be empty." };
    }

    if (!EVENT_CATEGORIES.includes(category)) {
        return { error: "Invalid event category." };
    }

    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    const deadline = new Date(registrationDeadline);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || Number.isNaN(deadline.getTime())) {
        return { error: "Invalid date or time format." };
    }

    if (start >= end) {
        return { error: "Start date and time must be before end date and time." };
    }

    if (deadline > start) {
        return { error: "Registration deadline must not be after the event start time." };
    }

    const parsedCapacity = Number(seatCapacity);
    if (!Number.isInteger(parsedCapacity) || parsedCapacity < 1) {
        return { error: "Seat capacity must be a positive integer." };
    }

    return {
        data: {
            title: String(title).trim(),
            description: String(description).trim(),
            category,
            venue: String(venue).trim(),
            startDateTime: start,
            endDateTime: end,
            registrationDeadline: deadline,
            seatCapacity: parsedCapacity,
            posterImage: body.posterImage ? String(body.posterImage).trim() : "",
        },
    };
};

const uploadPoster = async (req, res) => {
    try {
        let buffer = null;

        if (Buffer.isBuffer(req.body)) {
            buffer = req.body;
        } else if (req.body?.dataUrl && typeof req.body.dataUrl === "string") {
            const match = req.body.dataUrl.match(/^data:[^;]+;base64,(.+)$/);
            if (!match) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid image payload.",
                });
            }
            buffer = Buffer.from(match[1], "base64");
        }

        if (!buffer || buffer.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No image file provided.",
            });
        }

        if (buffer.length > MAX_POSTER_BYTES) {
            return res.status(400).json({
                success: false,
                message: "Poster image must be 2 MB or smaller.",
            });
        }

        const ext = detectImageExtension(buffer);
        if (!ext) {
            return res.status(400).json({
                success: false,
                message: "Unsupported image format. Only JPEG, PNG, WEBP, and GIF are allowed.",
            });
        }

        const uploadDir = path.join(process.cwd(), "uploads", "posters");
        await fs.mkdir(uploadDir, { recursive: true });

        const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
        await fs.writeFile(path.join(uploadDir, filename), buffer);

        return res.status(201).json({
            success: true,
            message: "Poster uploaded successfully.",
            posterUrl: `/uploads/posters/${filename}`,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to upload poster image.",
        });
    }
};

const createEvent = async (req, res) => {
    try {
        const club = await resolveOrganizerClub(req.user.userId);
        if (!club) {
            return res.status(403).json({
                success: false,
                message: "You must be assigned as a Club Head or Co-Head to create events.",
            });
        }

        if (req.body.clubId && req.body.clubId !== club._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You can only create events for your assigned club.",
            });
        }

        const validation = validateEventPayload(req.body);
        if (validation.error) {
            return res.status(400).json({
                success: false,
                message: validation.error,
            });
        }

        const event = await Event.create({
            ...validation.data,
            club: club._id,
            createdBy: req.user.userId,
            approvalStatus: "Pending",
            rejectionReason: "",
        });

        const populated = await Event.findById(event._id)
            .populate("club", "name category logo")
            .populate("createdBy", "name role")
            .lean();

        return res.status(201).json({
            success: true,
            message: "Event created and submitted for faculty approval.",
            event: populated,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to create event.",
        });
    }
};

const getPublicEvents = async (req, res) => {
    try {
        const { search, category, club, timeframe } = req.query;
        const filter = { approvalStatus: "Approved" };

        if (search && String(search).trim()) {
            filter.title = { $regex: escapeRegex(String(search).trim()), $options: "i" };
        }
        if (category && category !== "All") {
            filter.category = category;
        }
        if (club && club !== "All") {
            if (!isValidObjectId(club)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid club filter.",
                });
            }
            filter.club = club;
        }

        const now = new Date();
        if (timeframe === "upcoming") {
            filter.endDateTime = { $gte: now };
        } else if (timeframe === "past") {
            filter.endDateTime = { $lt: now };
        }

        const events = await Event.find(filter)
            .select("-rejectionReason")
            .populate("club", "name category logo")
            .populate("createdBy", "name role")
            .sort({ startDateTime: 1 })
            .lean();

        return res.status(200).json({
            success: true,
            events,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch events.",
        });
    }
};

const getMyClubEvents = async (req, res) => {
    try {
        const club = await resolveOrganizerClub(req.user.userId);
        if (!club) {
            return res.status(403).json({
                success: false,
                message: "No assigned club found for your account.",
            });
        }

        const events = await Event.find({ club: club._id })
            .populate("club", "name category logo")
            .populate("createdBy", "name role")
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            club,
            events,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch club events.",
        });
    }
};

const getManagedEvents = async (req, res) => {
    try {
        const { status, search, category, club } = req.query;
        const filter = {};

        if (status && status !== "All") {
            if (!APPROVAL_STATUSES.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid approval status filter.",
                });
            }
            filter.approvalStatus = status;
        }

        if (search && String(search).trim()) {
            filter.title = { $regex: escapeRegex(String(search).trim()), $options: "i" };
        }

        if (category && category !== "All") {
            filter.category = category;
        }

        if (club && club !== "All" && isValidObjectId(club)) {
            filter.club = club;
        }

        const events = await Event.find(filter)
            .populate("club", "name category logo")
            .populate("createdBy", "name email role")
            .populate("reviewedBy", "name")
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            events,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch events for management.",
        });
    }
};

const getEventById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID.",
            });
        }

        const event = await Event.findById(id)
            .populate("club", "name category logo clubHead coHead")
            .populate("createdBy", "name email role")
            .populate("reviewedBy", "name")
            .lean();

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found.",
            });
        }

        const isOrganizerOrFaculty = canManageEvent(event.club, req.user);

        if (event.approvalStatus !== "Approved" && !isOrganizerOrFaculty) {
            return res.status(403).json({
                success: false,
                message: "Access denied. This event is not publicly available.",
            });
        }

        const responseEvent = { ...event };
        if (!isOrganizerOrFaculty) {
            delete responseEvent.rejectionReason;
        }

        return res.status(200).json({
            success: true,
            event: responseEvent,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to load event details.",
        });
    }
};

const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID.",
            });
        }

        const event = await Event.findById(id).populate("club", "clubHead coHead");
        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found.",
            });
        }

        if (!canManageEvent(event.club, req.user)) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You can only edit events belonging to your assigned club.",
            });
        }

        if (event.approvalStatus === "Cancelled") {
            return res.status(400).json({
                success: false,
                message: "Cancelled events cannot be edited.",
            });
        }

        const merged = {
            title: req.body.title ?? event.title,
            description: req.body.description ?? event.description,
            category: req.body.category ?? event.category,
            venue: req.body.venue ?? event.venue,
            startDateTime: req.body.startDateTime ?? event.startDateTime,
            endDateTime: req.body.endDateTime ?? event.endDateTime,
            registrationDeadline: req.body.registrationDeadline ?? event.registrationDeadline,
            seatCapacity: req.body.seatCapacity ?? event.seatCapacity,
            posterImage: req.body.posterImage ?? event.posterImage,
        };

        const validation = validateEventPayload(merged);
        if (validation.error) {
            return res.status(400).json({
                success: false,
                message: validation.error,
            });
        }

        if (validation.data.seatCapacity < (event.registeredCount || 0)) {
            return res.status(400).json({
                success: false,
                message: `Seat capacity cannot be less than current registered count (${event.registeredCount}).`,
            });
        }

        Object.assign(event, validation.data);

        // Organizer edits require fresh faculty review if previously rejected/approved
        if (!isFacultyRole(req.user.role)) {
            event.approvalStatus = "Pending";
            event.rejectionReason = "";
            event.reviewedBy = null;
            event.reviewedAt = null;
        }

        await event.save();

        const populated = await Event.findById(event._id)
            .populate("club", "name category logo")
            .populate("createdBy", "name role")
            .lean();

        return res.status(200).json({
            success: true,
            message: "Event updated successfully.",
            event: populated,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update event.",
        });
    }
};

const approveEvent = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID.",
            });
        }

        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found.",
            });
        }

        if (event.approvalStatus === "Cancelled") {
            return res.status(400).json({
                success: false,
                message: "Cancelled events cannot be approved.",
            });
        }

        // Venue and time conflict detection:
        // Overlap condition: newStart < existingEnd && newEnd > existingStart
        // Ignores Cancelled, Pending, and Rejected events (only checks Approved events).
        const conflict = await Event.findOne({
            _id: { $ne: event._id },
            approvalStatus: "Approved",
            venue: { $regex: `^${escapeRegex(event.venue.trim())}$`, $options: "i" },
            startDateTime: { $lt: event.endDateTime },
            endDateTime: { $gt: event.startDateTime },
        }).lean();

        if (conflict) {
            return res.status(409).json({
                success: false,
                message: `Venue conflict: "${conflict.title}" is already approved at "${conflict.venue}" during an overlapping time window.`,
                conflictingEvent: {
                    _id: conflict._id,
                    title: conflict.title,
                    venue: conflict.venue,
                    startDateTime: conflict.startDateTime,
                    endDateTime: conflict.endDateTime,
                },
            });
        }

        event.approvalStatus = "Approved";
        event.rejectionReason = "";
        event.reviewedBy = req.user.userId;
        event.reviewedAt = new Date();
        await event.save();

        const populated = await Event.findById(event._id)
            .populate("club", "name category logo")
            .populate("createdBy", "name role")
            .populate("reviewedBy", "name")
            .lean();

        return res.status(200).json({
            success: true,
            message: "Event approved successfully.",
            event: populated,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to approve event.",
        });
    }
};

const rejectEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID.",
            });
        }

        if (!reason || !String(reason).trim()) {
            return res.status(400).json({
                success: false,
                message: "A rejection reason is required.",
            });
        }

        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found.",
            });
        }

        if (event.approvalStatus === "Cancelled") {
            return res.status(400).json({
                success: false,
                message: "Cancelled events cannot be rejected.",
            });
        }

        event.approvalStatus = "Rejected";
        event.rejectionReason = String(reason).trim();
        event.reviewedBy = req.user.userId;
        event.reviewedAt = new Date();
        await event.save();

        const populated = await Event.findById(event._id)
            .populate("club", "name category logo")
            .populate("createdBy", "name role")
            .populate("reviewedBy", "name")
            .lean();

        return res.status(200).json({
            success: true,
            message: "Event rejected.",
            event: populated,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to reject event.",
        });
    }
};

const cancelEvent = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID.",
            });
        }

        const event = await Event.findById(id).populate("club", "clubHead coHead");
        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found.",
            });
        }

        if (!canManageEvent(event.club, req.user)) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You cannot cancel events for another club.",
            });
        }

        event.approvalStatus = "Cancelled";
        await event.save();

        return res.status(200).json({
            success: true,
            message: "Event cancelled.",
            event,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to cancel event.",
        });
    }
};

export {
    canManageEvent,
    uploadPoster,
    createEvent,
    getPublicEvents,
    getMyClubEvents,
    getManagedEvents,
    getEventById,
    updateEvent,
    approveEvent,
    rejectEvent,
    cancelEvent,
};

import mongoose from "mongoose";
import Club, { CLUB_CATEGORIES } from "../models/club.model.js";
import ClubMembership from "../models/clubMembership.model.js";
import ClubAnnouncement from "../models/clubAnnouncement.model.js";
import User from "../models/user.model.js";
import { isFacultyRole } from "../middleware/role.middleware.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const canManageClub = (club, user) => {
    if (!club || !user) return false;
    if (isFacultyRole(user.role)) return true;
    if (user.role === "club_head" && club.clubHead) {
        return club.clubHead.toString() === user.userId;
    }
    return false;
};

const createClub = async (req, res) => {
    try {
        const { name, description, category, logo } = req.body;

        if (!name || !description || !category) {
            return res.status(400).json({
                success: false,
                message: "Name, description, and category are required.",
            });
        }

        if (!CLUB_CATEGORIES.includes(category)) {
            return res.status(400).json({
                success: false,
                message: "Invalid club category.",
            });
        }

        const existing = await Club.findOne({
            name: { $regex: `^${String(name).trim()}$`, $options: "i" },
        });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: "A club with this name already exists.",
            });
        }

        const club = await Club.create({
            name: String(name).trim(),
            description: String(description).trim(),
            category,
            logo: logo ? String(logo).trim() : "",
            createdBy: req.user.userId,
        });

        return res.status(201).json({
            success: true,
            message: "Club created successfully.",
            club: {
                ...club.toObject(),
                memberCount: 0,
                isMember: false,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to create club.",
        });
    }
};

const getAllClubs = async (req, res) => {
    try {
        const { category, search } = req.query;
        const filter = { isActive: true };

        if (category && category !== "All") {
            filter.category = category;
        }
        if (search && String(search).trim()) {
            const q = String(search).trim();
            filter.$or = [
                { name: { $regex: q, $options: "i" } },
                { description: { $regex: q, $options: "i" } },
            ];
        }

        const clubs = await Club.find(filter)
            .populate("clubHead", "name email rollNo")
            .sort({ createdAt: -1 })
            .lean();

        const clubIds = clubs.map((c) => c._id);

        const [counts, userMemberships] = await Promise.all([
            ClubMembership.aggregate([
                { $match: { club: { $in: clubIds } } },
                { $group: { _id: "$club", count: { $sum: 1 } } },
            ]),
            ClubMembership.find({
                club: { $in: clubIds },
                user: req.user.userId,
            })
                .select("club")
                .lean(),
        ]);

        const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));
        const memberSet = new Set(userMemberships.map((m) => m.club.toString()));

        const enriched = clubs.map((club) => ({
            ...club,
            memberCount: countMap.get(club._id.toString()) || 0,
            isMember: memberSet.has(club._id.toString()),
        }));

        return res.status(200).json({
            success: true,
            clubs: enriched,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch clubs.",
        });
    }
};

const getMyClubs = async (req, res) => {
    try {
        const memberships = await ClubMembership.find({ user: req.user.userId })
            .populate({
                path: "club",
                populate: { path: "clubHead", select: "name email" },
            })
            .sort({ joinedAt: -1 })
            .lean();

        const validMemberships = memberships.filter((m) => m.club && m.club.isActive);
        const clubIds = validMemberships.map((m) => m.club._id);

        const counts = await ClubMembership.aggregate([
            { $match: { club: { $in: clubIds } } },
            { $group: { _id: "$club", count: { $sum: 1 } } },
        ]);
        const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));

        const clubs = validMemberships.map((m) => ({
            ...m.club,
            memberCount: countMap.get(m.club._id.toString()) || 0,
            isMember: true,
            membershipRole: m.role,
            joinedAt: m.joinedAt,
        }));

        return res.status(200).json({
            success: true,
            clubs,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch your clubs.",
        });
    }
};

const getClubById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid club ID.",
            });
        }

        const club = await Club.findById(id)
            .populate("clubHead", "name email rollNo course")
            .lean();

        if (!club) {
            return res.status(404).json({
                success: false,
                message: "Club not found.",
            });
        }

        const [memberCount, membership] = await Promise.all([
            ClubMembership.countDocuments({ club: id }),
            ClubMembership.findOne({ club: id, user: req.user.userId }).lean(),
        ]);

        return res.status(200).json({
            success: true,
            club: {
                ...club,
                memberCount,
                isMember: Boolean(membership),
                membershipRole: membership?.role || null,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to load club details.",
        });
    }
};

const updateClub = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid club ID.",
            });
        }

        const club = await Club.findById(id);
        if (!club) {
            return res.status(404).json({
                success: false,
                message: "Club not found.",
            });
        }

        if (!canManageClub(club, req.user)) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only the assigned Club Head or Faculty can edit this club.",
            });
        }

        const { name, description, category, logo } = req.body;

        if (name !== undefined) {
            const trimmedName = String(name).trim();
            if (!trimmedName) {
                return res.status(400).json({
                    success: false,
                    message: "Club name cannot be empty.",
                });
            }
            const duplicate = await Club.findOne({
                _id: { $ne: id },
                name: { $regex: `^${trimmedName}$`, $options: "i" },
            });
            if (duplicate) {
                return res.status(409).json({
                    success: false,
                    message: "Another club with this name already exists.",
                });
            }
            club.name = trimmedName;
        }

        if (description !== undefined) {
            const trimmedDesc = String(description).trim();
            if (!trimmedDesc) {
                return res.status(400).json({
                    success: false,
                    message: "Description cannot be empty.",
                });
            }
            club.description = trimmedDesc;
        }

        if (category !== undefined) {
            if (!CLUB_CATEGORIES.includes(category)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid club category.",
                });
            }
            club.category = category;
        }

        if (logo !== undefined) {
            club.logo = String(logo).trim();
        }

        await club.save();

        const updated = await Club.findById(id)
            .populate("clubHead", "name email rollNo course")
            .lean();
        const memberCount = await ClubMembership.countDocuments({ club: id });

        return res.status(200).json({
            success: true,
            message: "Club updated successfully.",
            club: {
                ...updated,
                memberCount,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update club.",
        });
    }
};

const assignClubHead = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!isValidObjectId(id) || !isValidObjectId(userId)) {
            return res.status(400).json({
                success: false,
                message: "Valid club ID and user ID are required.",
            });
        }

        const club = await Club.findById(id);
        if (!club) {
            return res.status(404).json({
                success: false,
                message: "Club not found.",
            });
        }

        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: "Student not found.",
            });
        }

        if (isFacultyRole(targetUser.role)) {
            return res.status(400).json({
                success: false,
                message: "Faculty accounts cannot be assigned as a student Club Head.",
            });
        }

        if (
            targetUser.managedClub &&
            targetUser.managedClub.toString() !== club._id.toString()
        ) {
            return res.status(409).json({
                success: false,
                message: "This user is already assigned as Club Head of another club.",
            });
        }

        // Demote previous head of this club if different
        if (club.clubHead && club.clubHead.toString() !== targetUser._id.toString()) {
            await User.findByIdAndUpdate(club.clubHead, {
                role: "student",
                managedClub: null,
            });
            await ClubMembership.findOneAndUpdate(
                { club: club._id, user: club.clubHead },
                { role: "member" }
            );
        }

        targetUser.role = "club_head";
        targetUser.managedClub = club._id;
        await targetUser.save();

        club.clubHead = targetUser._id;
        await club.save();

        await ClubMembership.findOneAndUpdate(
            { club: club._id, user: targetUser._id },
            { club: club._id, user: targetUser._id, role: "head" },
            { upsert: true, new: true }
        );

        const updatedClub = await Club.findById(id)
            .populate("clubHead", "name email rollNo course")
            .lean();

        return res.status(200).json({
            success: true,
            message: `${targetUser.name} assigned as Club Head.`,
            club: updatedClub,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to assign Club Head.",
        });
    }
};

const joinClub = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid club ID.",
            });
        }

        const club = await Club.findById(id);
        if (!club || !club.isActive) {
            return res.status(404).json({
                success: false,
                message: "Club not found.",
            });
        }

        const existing = await ClubMembership.findOne({
            club: id,
            user: req.user.userId,
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "You are already a member of this club.",
            });
        }

        await ClubMembership.create({
            club: id,
            user: req.user.userId,
            role: "member",
        });

        const memberCount = await ClubMembership.countDocuments({ club: id });

        return res.status(201).json({
            success: true,
            message: `Joined ${club.name}.`,
            memberCount,
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "You are already a member of this club.",
            });
        }
        return res.status(500).json({
            success: false,
            message: "Failed to join club.",
        });
    }
};

const leaveClub = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid club ID.",
            });
        }

        const club = await Club.findById(id);
        if (!club) {
            return res.status(404).json({
                success: false,
                message: "Club not found.",
            });
        }

        if (club.clubHead && club.clubHead.toString() === req.user.userId) {
            return res.status(400).json({
                success: false,
                message: "Assigned Club Head cannot leave without faculty reassignment.",
            });
        }

        const deleted = await ClubMembership.findOneAndDelete({
            club: id,
            user: req.user.userId,
        });

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "You are not a member of this club.",
            });
        }

        const memberCount = await ClubMembership.countDocuments({ club: id });

        return res.status(200).json({
            success: true,
            message: `Left ${club.name}.`,
            memberCount,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to leave club.",
        });
    }
};

const getClubMembers = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid club ID.",
            });
        }

        const club = await Club.findById(id);
        if (!club) {
            return res.status(404).json({
                success: false,
                message: "Club not found.",
            });
        }

        const members = await ClubMembership.find({ club: id })
            .populate("user", "name email rollNo course semester role")
            .sort({ role: 1, joinedAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            members: members.filter((m) => m.user),
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to load club members.",
        });
    }
};

const getClubAnnouncements = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid club ID.",
            });
        }

        const club = await Club.findById(id);
        if (!club) {
            return res.status(404).json({
                success: false,
                message: "Club not found.",
            });
        }

        const isManager = canManageClub(club, req.user);
        const membership = await ClubMembership.findOne({
            club: id,
            user: req.user.userId,
        });

        if (!isManager && !membership) {
            return res.status(403).json({
                success: false,
                message: "Join this club to view its announcements.",
            });
        }

        const announcements = await ClubAnnouncement.find({ club: id })
            .populate("createdBy", "name role")
            .sort({ isPinned: -1, createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            announcements,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch announcements.",
        });
    }
};

const createClubAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, isPinned } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid club ID.",
            });
        }

        if (!title || !content || !String(title).trim() || !String(content).trim()) {
            return res.status(400).json({
                success: false,
                message: "Announcement title and content are required.",
            });
        }

        const club = await Club.findById(id);
        if (!club) {
            return res.status(404).json({
                success: false,
                message: "Club not found.",
            });
        }

        if (!canManageClub(club, req.user)) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only this club's Head or Faculty can post announcements.",
            });
        }

        const announcement = await ClubAnnouncement.create({
            club: id,
            title: String(title).trim(),
            content: String(content).trim(),
            isPinned: Boolean(isPinned),
            createdBy: req.user.userId,
        });

        const populated = await ClubAnnouncement.findById(announcement._id)
            .populate("createdBy", "name role")
            .lean();

        return res.status(201).json({
            success: true,
            message: "Announcement posted.",
            announcement: populated,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to create announcement.",
        });
    }
};

const updateClubAnnouncement = async (req, res) => {
    try {
        const { id, announcementId } = req.params;
        if (!isValidObjectId(id) || !isValidObjectId(announcementId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ID.",
            });
        }

        const club = await Club.findById(id);
        if (!club) {
            return res.status(404).json({
                success: false,
                message: "Club not found.",
            });
        }

        if (!canManageClub(club, req.user)) {
            return res.status(403).json({
                success: false,
                message: "Access denied.",
            });
        }

        const announcement = await ClubAnnouncement.findOne({
            _id: announcementId,
            club: id,
        });

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: "Announcement not found.",
            });
        }

        const { title, content, isPinned } = req.body;
        if (title !== undefined && String(title).trim()) {
            announcement.title = String(title).trim();
        }
        if (content !== undefined && String(content).trim()) {
            announcement.content = String(content).trim();
        }
        if (isPinned !== undefined) {
            announcement.isPinned = Boolean(isPinned);
        }

        await announcement.save();

        const populated = await ClubAnnouncement.findById(announcement._id)
            .populate("createdBy", "name role")
            .lean();

        return res.status(200).json({
            success: true,
            message: "Announcement updated.",
            announcement: populated,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update announcement.",
        });
    }
};

const deleteClubAnnouncement = async (req, res) => {
    try {
        const { id, announcementId } = req.params;
        if (!isValidObjectId(id) || !isValidObjectId(announcementId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ID.",
            });
        }

        const club = await Club.findById(id);
        if (!club) {
            return res.status(404).json({
                success: false,
                message: "Club not found.",
            });
        }

        if (!canManageClub(club, req.user)) {
            return res.status(403).json({
                success: false,
                message: "Access denied.",
            });
        }

        const deleted = await ClubAnnouncement.findOneAndDelete({
            _id: announcementId,
            club: id,
        });

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Announcement not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Announcement deleted.",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete announcement.",
        });
    }
};

export {
    createClub,
    getAllClubs,
    getMyClubs,
    getClubById,
    updateClub,
    assignClubHead,
    joinClub,
    leaveClub,
    getClubMembers,
    getClubAnnouncements,
    createClubAnnouncement,
    updateClubAnnouncement,
    deleteClubAnnouncement,
};

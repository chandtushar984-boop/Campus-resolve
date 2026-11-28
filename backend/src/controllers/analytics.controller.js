import mongoose from "mongoose";
import Club from "../models/club.model.js";
import ClubMembership from "../models/clubMembership.model.js";
import Event from "../models/event.model.js";
import EventRegistration from "../models/eventRegistration.model.js";
import Notification from "../models/notification.model.js";
import { getClubRatingsMap, getEventRatingsMap } from "./review.controller.js";

const getStudentAnalytics = async (req, res) => {
    try {
        const userId = req.user.userId;
        const now = new Date();

        const [
            joinedClubsCount,
            activeRegistrations,
            recentNotifications,
            unreadNotificationsCount,
        ] = await Promise.all([
            ClubMembership.countDocuments({ user: userId }),
            EventRegistration.find({ student: userId, status: "Registered" })
                .populate({
                    path: "event",
                    select: "title venue startDateTime endDateTime approvalStatus category club",
                    populate: { path: "club", select: "name" },
                })
                .sort({ createdAt: -1 })
                .lean(),
            Notification.find({ recipient: userId })
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),
            Notification.countDocuments({ recipient: userId, read: false }),
        ]);

        const upcomingRegisteredEvents = activeRegistrations
            .filter(
                (reg) =>
                    reg.event &&
                    reg.event.approvalStatus === "Approved" &&
                    new Date(reg.event.endDateTime) >= now
            )
            .sort(
                (a, b) =>
                    new Date(a.event.startDateTime) -
                    new Date(b.event.startDateTime)
            );

        return res.status(200).json({
            success: true,
            analytics: {
                joinedClubsCount,
                activeTicketsCount: activeRegistrations.length,
                upcomingEventsCount: upcomingRegisteredEvents.length,
                upcomingRegisteredEvents,
                recentNotifications,
                unreadNotificationsCount,
            },
        });
    } catch {
        return res.status(500).json({
            success: false,
            message: "Failed to load student analytics.",
        });
    }
};

const getClubHeadAnalytics = async (req, res) => {
    try {
        const userId = req.user.userId;
        const club = await Club.findOne({
            $or: [{ clubHead: userId }, { coHead: userId }],
        }).lean();

        if (!club) {
            return res.status(200).json({
                success: true,
                analytics: {
                    club: null,
                    memberCount: 0,
                    totalEvents: 0,
                    upcomingEvents: 0,
                    pendingApprovalEvents: 0,
                    totalRegistrations: 0,
                    totalCapacity: 0,
                    totalAttended: 0,
                    clubRating: { averageRating: null, reviewCount: 0 },
                    eventStats: [],
                },
            });
        }

        const clubIdStr = club._id.toString();
        const now = new Date();

        const [memberCount, events, clubRatingsMap] = await Promise.all([
            ClubMembership.countDocuments({ club: club._id }),
            Event.find({ club: club._id })
                .select(
                    "title category venue startDateTime endDateTime seatCapacity registeredCount approvalStatus"
                )
                .sort({ startDateTime: -1 })
                .lean(),
            getClubRatingsMap([clubIdStr]),
        ]);

        const eventIds = events.map((ev) => ev._id);
        const [eventRatingsMap, attendedCounts] = await Promise.all([
            getEventRatingsMap(eventIds.map((id) => id.toString())),
            eventIds.length > 0
                ? EventRegistration.aggregate([
                      {
                          $match: {
                              event: { $in: eventIds },
                              status: "Registered",
                              attendanceStatus: "Attended",
                          },
                      },
                      { $group: { _id: "$event", attended: { $sum: 1 } } },
                  ])
                : [],
        ]);

        const attendedMap = new Map(
            attendedCounts.map((row) => [row._id.toString(), row.attended])
        );

        let totalRegistrations = 0;
        let totalCapacity = 0;
        let totalAttended = 0;
        let upcomingEvents = 0;
        let pendingApprovalEvents = 0;

        const eventStats = events.map((ev) => {
            const idStr = ev._id.toString();
            const regs = ev.registeredCount || 0;
            const cap = ev.seatCapacity || 0;
            const attended = attendedMap.get(idStr) || 0;
            const rating = eventRatingsMap.get(idStr) || {
                averageRating: null,
                reviewCount: 0,
            };

            if (ev.approvalStatus === "Approved") {
                totalRegistrations += regs;
                totalCapacity += cap;
                totalAttended += attended;
                if (new Date(ev.endDateTime) >= now) {
                    upcomingEvents += 1;
                }
            }
            if (ev.approvalStatus === "Pending") {
                pendingApprovalEvents += 1;
            }

            return {
                _id: ev._id,
                title: ev.title,
                category: ev.category,
                venue: ev.venue,
                startDateTime: ev.startDateTime,
                approvalStatus: ev.approvalStatus,
                registeredCount: regs,
                seatCapacity: cap,
                attendedCount: attended,
                averageRating: rating.averageRating,
                reviewCount: rating.reviewCount,
            };
        });

        const clubRating = clubRatingsMap.get(clubIdStr) || {
            averageRating: null,
            reviewCount: 0,
        };

        return res.status(200).json({
            success: true,
            analytics: {
                club: {
                    _id: club._id,
                    name: club.name,
                    category: club.category,
                    description: club.description,
                },
                memberCount,
                totalEvents: events.length,
                upcomingEvents,
                pendingApprovalEvents,
                totalRegistrations,
                totalCapacity,
                totalAttended,
                clubRating,
                eventStats,
            },
        });
    } catch {
        return res.status(500).json({
            success: false,
            message: "Failed to load club head analytics.",
        });
    }
};

const getFacultyAnalytics = async (req, res) => {
    try {
        const [
            totalClubs,
            totalEvents,
            pendingApprovals,
            totalRegistrations,
            clubAgg,
            categoryAgg,
        ] = await Promise.all([
            Club.countDocuments({ isActive: true }),
            Event.countDocuments({}),
            Event.countDocuments({ approvalStatus: "Pending" }),
            EventRegistration.countDocuments({ status: "Registered" }),
            Event.aggregate([
                { $match: { approvalStatus: "Approved" } },
                {
                    $group: {
                        _id: "$club",
                        registrations: { $sum: { $ifNull: ["$registeredCount", 0] } },
                        eventsCount: { $sum: 1 },
                    },
                },
                {
                    $lookup: {
                        from: "clubs",
                        localField: "_id",
                        foreignField: "_id",
                        as: "clubDoc",
                    },
                },
                {
                    $unwind: {
                        path: "$clubDoc",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $project: {
                        _id: 0,
                        clubId: "$_id",
                        clubName: { $ifNull: ["$clubDoc.name", "Unknown Club"] },
                        registrations: 1,
                        eventsCount: 1,
                    },
                },
                { $sort: { registrations: -1, clubName: 1 } },
            ]),
            Event.aggregate([
                {
                    $group: {
                        _id: "$category",
                        count: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        category: "$_id",
                        count: 1,
                    },
                },
                { $sort: { count: -1, category: 1 } },
            ]),
        ]);

        return res.status(200).json({
            success: true,
            analytics: {
                summary: {
                    totalClubs,
                    totalEvents,
                    pendingApprovals,
                    totalRegistrations,
                },
                clubRegistrations: clubAgg,
                categoryDistribution: categoryAgg,
            },
        });
    } catch {
        return res.status(500).json({
            success: false,
            message: "Failed to load faculty analytics.",
        });
    }
};

export {
    getStudentAnalytics,
    getClubHeadAnalytics,
    getFacultyAnalytics,
};

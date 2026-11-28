import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import { authorizeRoles } from "../src/middleware/role.middleware.js";
import {
    getClubHeadAnalytics,
    getFacultyAnalytics,
    getStudentAnalytics,
} from "../src/controllers/analytics.controller.js";
import {
    escapeCsvField,
    exportEventRegistrationsCsv,
} from "../src/controllers/registration.controller.js";
import Club from "../src/models/club.model.js";
import ClubMembership from "../src/models/clubMembership.model.js";
import Event from "../src/models/event.model.js";
import EventRegistration from "../src/models/eventRegistration.model.js";
import EventReview from "../src/models/eventReview.model.js";
import Notification from "../src/models/notification.model.js";

const createMockRes = () => ({
    statusCode: 200,
    body: null,
    headers: {},
    setHeader(k, v) {
        this.headers[k] = v;
    },
    status(code) {
        this.statusCode = code;
        return this;
    },
    json(payload) {
        this.body = payload;
        return this;
    },
    send(payload) {
        this.body = payload;
        return this;
    },
});

const oid = () => new mongoose.Types.ObjectId().toString();

test("Analytics and CSV export routes enforce role-based authorization", () => {
    const studentOnly = authorizeRoles("student");
    const clubHeadOnly = authorizeRoles("club_head", "co_head");
    const facultyOnly = authorizeRoles("faculty", "admin");

    const r1 = createMockRes();
    studentOnly({ user: { userId: "u1", role: "faculty" } }, r1, () => {});
    assert.equal(r1.statusCode, 403);

    const r2 = createMockRes();
    clubHeadOnly({ user: { userId: "u2", role: "student" } }, r2, () => {});
    assert.equal(r2.statusCode, 403);

    const r3 = createMockRes();
    facultyOnly({ user: { userId: "u3", role: "club_head" } }, r3, () => {});
    assert.equal(r3.statusCode, 403);
});

test("getStudentAnalytics returns joined clubs, upcoming events, tickets, and notifications", async (t) => {
    const origMembershipCount = ClubMembership.countDocuments;
    const origRegFind = EventRegistration.find;
    const origNotifFind = Notification.find;
    const origNotifCount = Notification.countDocuments;

    t.after(() => {
        ClubMembership.countDocuments = origMembershipCount;
        EventRegistration.find = origRegFind;
        Notification.find = origNotifFind;
        Notification.countDocuments = origNotifCount;
    });

    const studentId = oid();
    const futureStart = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const futureEnd = new Date(futureStart.getTime() + 2 * 60 * 60 * 1000);

    ClubMembership.countDocuments = async () => 2;
    EventRegistration.find = () => ({
        populate: () => ({
            sort: () => ({
                lean: async () => [
                    {
                        _id: oid(),
                        ticketCode: "TKT-111122223333",
                        event: {
                            _id: oid(),
                            title: "AI Workshop",
                            venue: "Main Auditorium",
                            startDateTime: futureStart,
                            endDateTime: futureEnd,
                            approvalStatus: "Approved",
                        },
                    },
                ],
            }),
        }),
    });
    Notification.find = () => ({
        sort: () => ({
            limit: () => ({
                lean: async () => [{ _id: oid(), title: "Registration Confirmed", read: false }],
            }),
        }),
    });
    Notification.countDocuments = async () => 1;

    const res = createMockRes();
    await getStudentAnalytics({ user: { userId: studentId, role: "student" } }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.analytics.joinedClubsCount, 2);
    assert.equal(res.body.analytics.activeTicketsCount, 1);
    assert.equal(res.body.analytics.upcomingEventsCount, 1);
    assert.equal(res.body.analytics.unreadNotificationsCount, 1);
});

test("getClubHeadAnalytics returns club stats, registration counts, and ratings", async (t) => {
    const origClubFindOne = Club.findOne;
    const origMembershipCount = ClubMembership.countDocuments;
    const origEventFind = Event.find;
    const origRegAggregate = EventRegistration.aggregate;
    const origReviewAggregate = EventReview.aggregate;

    t.after(() => {
        Club.findOne = origClubFindOne;
        ClubMembership.countDocuments = origMembershipCount;
        Event.find = origEventFind;
        EventRegistration.aggregate = origRegAggregate;
        EventReview.aggregate = origReviewAggregate;
    });

    const clubId = new mongoose.Types.ObjectId();
    const eventId = new mongoose.Types.ObjectId();
    const headId = oid();

    Club.findOne = () => ({
        lean: async () => ({
            _id: clubId,
            name: "AI Society",
            category: "Technical",
            description: "AI club",
        }),
    });
    ClubMembership.countDocuments = async () => 35;
    Event.find = () => ({
        select: () => ({
            sort: () => ({
                lean: async () => [
                    {
                        _id: eventId,
                        title: "LLM Bootcamp",
                        category: "Workshop",
                        venue: "Lab 302",
                        startDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                        endDateTime: new Date(Date.now() + 27 * 60 * 60 * 1000),
                        seatCapacity: 50,
                        registeredCount: 40,
                        approvalStatus: "Approved",
                    },
                ],
            }),
        }),
    });
    EventRegistration.aggregate = async () => [{ _id: eventId, attended: 32 }];
    EventReview.aggregate = async () => [
        { _id: clubId, averageRating: 4.5, reviewCount: 10 },
    ];

    const res = createMockRes();
    await getClubHeadAnalytics({ user: { userId: headId, role: "club_head" } }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.analytics.memberCount, 35);
    assert.equal(res.body.analytics.totalEvents, 1);
    assert.equal(res.body.analytics.upcomingEvents, 1);
    assert.equal(res.body.analytics.totalRegistrations, 40);
    assert.equal(res.body.analytics.totalAttended, 32);
});

test("getFacultyAnalytics returns summary, club registrations, and category distribution", async (t) => {
    const origClubCount = Club.countDocuments;
    const origEventCount = Event.countDocuments;
    const origRegCount = EventRegistration.countDocuments;
    const origEventAggregate = Event.aggregate;

    t.after(() => {
        Club.countDocuments = origClubCount;
        Event.countDocuments = origEventCount;
        EventRegistration.countDocuments = origRegCount;
        Event.aggregate = origEventAggregate;
    });

    Club.countDocuments = async () => 3;
    let eventCountCalls = 0;
    Event.countDocuments = async () => {
        eventCountCalls += 1;
        return eventCountCalls === 1 ? 8 : 2;
    };
    EventRegistration.countDocuments = async () => 145;

    let aggCall = 0;
    Event.aggregate = async () => {
        aggCall += 1;
        if (aggCall === 1) {
            return [{ clubName: "AI Society", registrations: 100, eventsCount: 2 }];
        }
        return [{ category: "Technical", count: 5 }];
    };

    const res = createMockRes();
    await getFacultyAnalytics({ user: { userId: oid(), role: "faculty" } }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.analytics.summary.totalClubs, 3);
    assert.equal(res.body.analytics.summary.totalEvents, 8);
    assert.equal(res.body.analytics.summary.pendingApprovals, 2);
    assert.equal(res.body.analytics.summary.totalRegistrations, 145);
    assert.equal(res.body.analytics.clubRegistrations[0].clubName, "AI Society");
    assert.equal(res.body.analytics.categoryDistribution[0].category, "Technical");
});

test("CSV export enforces club authorization, prevents formula injection, and excludes sensitive fields", async (t) => {
    const origEventFindById = Event.findById;
    const origRegFind = EventRegistration.find;

    t.after(() => {
        Event.findById = origEventFindById;
        EventRegistration.find = origRegFind;
    });

    const eventId = oid();
    const headId = oid();
    const otherHeadId = oid();

    Event.findById = () => ({
        populate: () => ({
            lean: async () => ({
                _id: eventId,
                club: { _id: oid(), clubHead: headId, coHead: null },
            }),
        }),
    });

    // 1. Other club's head is blocked -> 403
    const forbiddenRes = createMockRes();
    await exportEventRegistrationsCsv(
        { params: { id: eventId }, user: { userId: otherHeadId, role: "club_head" } },
        forbiddenRes
    );
    assert.equal(forbiddenRes.statusCode, 403);

    // 2. Authorized head exports CSV with formula-injection protection
    EventRegistration.find = () => ({
        populate: () => ({
            sort: () => ({
                lean: async () => [
                    {
                        registeredAt: new Date("2026-11-20T10:00:00.000Z"),
                        attendanceStatus: "Attended",
                        student: {
                            name: '=CMD("calc")',
                            email: "2301010099@krmu.edu.in",
                            rollNo: "2301010099",
                            password: "secret_hash_should_never_appear",
                        },
                    },
                ],
            }),
        }),
    });

    const okRes = createMockRes();
    await exportEventRegistrationsCsv(
        { params: { id: eventId }, user: { userId: headId, role: "club_head" } },
        okRes
    );

    assert.equal(okRes.statusCode, 200);
    assert.match(okRes.headers["Content-Type"], /text\/csv/);
    assert.match(okRes.body, /"Student Name","University Email","Roll Number","Registration Date","Attendance Status"/);
    assert.match(okRes.body, /"'=CMD\(""calc""\)"/);
    assert.equal(okRes.body.includes("secret_hash_should_never_appear"), false);

    // Direct escapeCsvField checks
    assert.equal(escapeCsvField("+1+2"), "\"'+1+2\"");
    assert.equal(escapeCsvField("@SUM(A1)"), "\"'@SUM(A1)\"");
    assert.equal(escapeCsvField('Jane "J" Doe'), '"Jane ""J"" Doe"');
});

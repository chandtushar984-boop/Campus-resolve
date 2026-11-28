import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import {
    getClubRatingsMap,
    getEventRatingsMap,
    submitEventReview,
} from "../src/controllers/review.controller.js";
import {
    getMyNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
} from "../src/controllers/notification.controller.js";
import {
    createNotification,
    createNotificationsForUsers,
} from "../src/services/notification.service.js";
import {
    isSmtpConfigured,
    sendEmail,
    sendEventRejectedEmail,
    sendRegistrationConfirmationEmail,
} from "../src/services/email.service.js";
import Event from "../src/models/event.model.js";
import EventRegistration from "../src/models/eventRegistration.model.js";
import EventReview from "../src/models/eventReview.model.js";
import Notification from "../src/models/notification.model.js";

const createMockRes = () => ({
    statusCode: 200,
    body: null,
    status(code) {
        this.statusCode = code;
        return this;
    },
    json(payload) {
        this.body = payload;
        return this;
    },
});

const oid = () => new mongoose.Types.ObjectId().toString();

test("submitEventReview enforces event ended, registration, and Attended eligibility", async (t) => {
    const origEventFindById = Event.findById;
    const origRegFindOne = EventRegistration.findOne;
    const origRevFindOne = EventReview.findOne;
    const origRevCreate = EventReview.create;
    const origRevFindById = EventReview.findById;
    const origRevAggregate = EventReview.aggregate;

    t.after(() => {
        Event.findById = origEventFindById;
        EventRegistration.findOne = origRegFindOne;
        EventReview.findOne = origRevFindOne;
        EventReview.create = origRevCreate;
        EventReview.findById = origRevFindById;
        EventReview.aggregate = origRevAggregate;
    });

    const eventId = oid();
    const clubId = oid();
    const studentId = oid();

    // 1. Event has not ended yet -> 400
    Event.findById = () => ({
        lean: async () => ({
            _id: eventId,
            club: clubId,
            approvalStatus: "Approved",
            endDateTime: new Date(Date.now() + 60 * 60 * 1000),
        }),
    });
    const resNotEnded = createMockRes();
    await submitEventReview(
        {
            params: { id: eventId },
            body: { rating: 5, comment: "Great event!" },
            user: { userId: studentId, role: "student" },
        },
        resNotEnded
    );
    assert.equal(resNotEnded.statusCode, 400);

    // Past event for remaining checks
    Event.findById = () => ({
        lean: async () => ({
            _id: eventId,
            club: clubId,
            approvalStatus: "Approved",
            endDateTime: new Date(Date.now() - 60 * 60 * 1000),
        }),
    });

    // 2. Student not registered -> 403
    EventRegistration.findOne = () => ({ lean: async () => null });
    const resNotReg = createMockRes();
    await submitEventReview(
        {
            params: { id: eventId },
            body: { rating: 4, comment: "Good!" },
            user: { userId: studentId, role: "student" },
        },
        resNotReg
    );
    assert.equal(resNotReg.statusCode, 403);

    // 3. Student registered but not marked Attended -> 403
    EventRegistration.findOne = () => ({
        lean: async () => ({
            _id: oid(),
            status: "Registered",
            attendanceStatus: "Registered",
        }),
    });
    const resNotAttended = createMockRes();
    await submitEventReview(
        {
            params: { id: eventId },
            body: { rating: 4, comment: "Good!" },
            user: { userId: studentId, role: "student" },
        },
        resNotAttended
    );
    assert.equal(resNotAttended.statusCode, 403);

    // 4. Eligible student submits review -> 201
    EventRegistration.findOne = () => ({
        lean: async () => ({
            _id: oid(),
            status: "Registered",
            attendanceStatus: "Attended",
        }),
    });
    EventReview.findOne = () => ({ lean: async () => null });
    const reviewId = oid();
    EventReview.create = async (data) => ({ _id: reviewId, ...data });
    EventReview.findById = () => ({
        populate: () => ({
            lean: async () => ({
                _id: reviewId,
                rating: 5,
                comment: "Well organized workshop!",
            }),
        }),
    });
    EventReview.aggregate = async () => [
        { _id: new mongoose.Types.ObjectId(eventId), averageRating: 5, reviewCount: 1 },
    ];

    const resOk = createMockRes();
    await submitEventReview(
        {
            params: { id: eventId },
            body: { rating: 5, comment: "Well organized workshop!" },
            user: { userId: studentId, role: "student" },
        },
        resOk
    );
    assert.equal(resOk.statusCode, 201);
    assert.equal(resOk.body.ratingSummary.averageRating, 5);
    assert.equal(resOk.body.ratingSummary.reviewCount, 1);
});

test("submitEventReview prevents duplicate reviews via check and 11000 constraint", async (t) => {
    const origEventFindById = Event.findById;
    const origRegFindOne = EventRegistration.findOne;
    const origRevFindOne = EventReview.findOne;
    const origRevCreate = EventReview.create;

    t.after(() => {
        Event.findById = origEventFindById;
        EventRegistration.findOne = origRegFindOne;
        EventReview.findOne = origRevFindOne;
        EventReview.create = origRevCreate;
    });

    const eventId = oid();
    const studentId = oid();

    Event.findById = () => ({
        lean: async () => ({
            _id: eventId,
            club: oid(),
            approvalStatus: "Approved",
            endDateTime: new Date(Date.now() - 60 * 60 * 1000),
        }),
    });
    EventRegistration.findOne = () => ({
        lean: async () => ({
            _id: oid(),
            status: "Registered",
            attendanceStatus: "Attended",
        }),
    });

    // 1. Existing review -> 409
    EventReview.findOne = () => ({ lean: async () => ({ _id: oid() }) });
    const resDup = createMockRes();
    await submitEventReview(
        {
            params: { id: eventId },
            body: { rating: 5, comment: "Duplicate" },
            user: { userId: studentId, role: "student" },
        },
        resDup
    );
    assert.equal(resDup.statusCode, 409);

    // 2. Concurrent insert hitting 11000 -> 409
    EventReview.findOne = () => ({ lean: async () => null });
    EventReview.create = async () => {
        const err = new Error("E11000 duplicate key error");
        err.code = 11000;
        throw err;
    };
    const resRaceDup = createMockRes();
    await submitEventReview(
        {
            params: { id: eventId },
            body: { rating: 5, comment: "Concurrent duplicate" },
            user: { userId: studentId, role: "student" },
        },
        resRaceDup
    );
    assert.equal(resRaceDup.statusCode, 409);
});

test("getEventRatingsMap and getClubRatingsMap compute accurate and weighted ratings", async (t) => {
    const origAggregate = EventReview.aggregate;
    t.after(() => {
        EventReview.aggregate = origAggregate;
    });

    const eventA = oid();
    const clubA = oid();
    const clubNoReviews = oid();

    EventReview.aggregate = async () => [
        {
            _id: new mongoose.Types.ObjectId(eventA),
            averageRating: 4.333333,
            reviewCount: 3,
        },
    ];
    const eventMap = await getEventRatingsMap([eventA]);
    assert.deepEqual(eventMap.get(eventA), {
        averageRating: 4.33,
        reviewCount: 3,
    });

    // Weighted club rating: e.g. (10 * 4.5 + 2 * 3.0) / 12 = 4.25 across 12 reviews
    EventReview.aggregate = async () => [
        {
            _id: new mongoose.Types.ObjectId(clubA),
            averageRating: (10 * 4.5 + 2 * 3.0) / 12,
            reviewCount: 12,
        },
    ];
    const clubMap = await getClubRatingsMap([clubA, clubNoReviews]);
    assert.deepEqual(clubMap.get(clubA), {
        averageRating: 4.25,
        reviewCount: 12,
    });
    assert.equal(clubMap.has(clubNoReviews), false);
});

test("Notifications enforce recipient authorization, unread count, and read updates", async (t) => {
    const origFind = Notification.find;
    const origCount = Notification.countDocuments;
    const origFindById = Notification.findById;
    const origUpdateMany = Notification.updateMany;
    const origCreate = Notification.create;
    const origInsertMany = Notification.insertMany;

    t.after(() => {
        Notification.find = origFind;
        Notification.countDocuments = origCount;
        Notification.findById = origFindById;
        Notification.updateMany = origUpdateMany;
        Notification.create = origCreate;
        Notification.insertMany = origInsertMany;
    });

    const userId = oid();
    const otherUserId = oid();
    const notifId = oid();

    Notification.find = () => ({
        sort: () => ({
            limit: () => ({
                lean: async () => [{ _id: notifId, title: "Event Approved", read: false }],
            }),
        }),
    });
    Notification.countDocuments = async () => 1;

    const listRes = createMockRes();
    await getMyNotifications({ user: { userId } }, listRes);
    assert.equal(listRes.statusCode, 200);
    assert.equal(listRes.body.unreadCount, 1);
    assert.equal(listRes.body.notifications.length, 1);

    // Other user cannot mark someone else's notification as read -> 403
    Notification.findById = async () => ({
        _id: notifId,
        recipient: userId,
        read: false,
        save: async () => {},
    });
    const forbiddenRes = createMockRes();
    await markNotificationAsRead(
        { params: { id: notifId }, user: { userId: otherUserId } },
        forbiddenRes
    );
    assert.equal(forbiddenRes.statusCode, 403);

    // Owner marks as read -> 200
    const ownerRes = createMockRes();
    await markNotificationAsRead(
        { params: { id: notifId }, user: { userId } },
        ownerRes
    );
    assert.equal(ownerRes.statusCode, 200);
    assert.equal(ownerRes.body.notification.read, true);

    // Mark all read -> 200
    let markAllCalled = false;
    Notification.updateMany = async (filter) => {
        if (filter.recipient === userId && filter.read === false) {
            markAllCalled = true;
        }
        return { modifiedCount: 1 };
    };
    const markAllRes = createMockRes();
    await markAllNotificationsAsRead({ user: { userId } }, markAllRes);
    assert.equal(markAllRes.statusCode, 200);
    assert.equal(markAllCalled, true);

    // Service helpers swallow DB errors safely
    Notification.create = async () => {
        throw new Error("DB error");
    };
    Notification.insertMany = async () => {
        throw new Error("DB error");
    };
    assert.equal(
        await createNotification({
            recipient: userId,
            type: "event_approved",
            title: "Test",
            message: "Test",
        }),
        null
    );
    assert.deepEqual(
        await createNotificationsForUsers([userId], {
            type: "club_announcement",
            title: "Test",
            message: "Test",
        }),
        []
    );
});

test("Email service handles missing SMTP, delivery success, and delivery failure safely", async () => {
    const savedEnv = {
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_USER: process.env.SMTP_USER,
        SMTP_PASS: process.env.SMTP_PASS,
    };

    try {
        delete process.env.SMTP_HOST;
        delete process.env.SMTP_PORT;
        delete process.env.SMTP_USER;
        delete process.env.SMTP_PASS;

        // 1. Missing SMTP configuration -> reports not configured, does not crash
        assert.equal(isSmtpConfigured(), false);
        const unconfiguredResult = await sendEmail({
            to: "student@krmu.edu.in",
            subject: "Test",
            text: "Hello",
            html: "<p>Hello</p>",
        });
        assert.equal(unconfiguredResult.sent, false);
        assert.equal(unconfiguredResult.configured, false);

        // 2. Delivery success with mock transporter
        let sentPayload = null;
        const okTransporter = {
            sendMail: async (payload) => {
                sentPayload = payload;
                return { messageId: "msg-123" };
            },
        };
        const okResult = await sendRegistrationConfirmationEmail(
            {
                to: "student@krmu.edu.in",
                studentName: "Aarav",
                eventTitle: "AI Workshop",
                venue: "Main Auditorium",
                startDateTime: new Date().toISOString(),
                ticketCode: "TKT-AABBCCDDEEFF",
            },
            okTransporter
        );
        assert.equal(okResult.sent, true);
        assert.equal(okResult.messageId, "msg-123");
        assert.match(sentPayload.subject, /AI Workshop/);
        assert.match(sentPayload.html, /TKT-AABBCCDDEEFF/);

        // 3. Delivery failure does not throw
        const failingTransporter = {
            sendMail: async () => {
                throw new Error("SMTP connection refused");
            },
        };
        const failResult = await sendEventRejectedEmail(
            {
                to: "head@krmu.edu.in",
                organizerName: "Priya",
                eventTitle: "Hackathon",
                reason: "Venue conflict",
            },
            failingTransporter
        );
        assert.equal(failResult.sent, false);
        assert.equal(failResult.configured, true);
        assert.match(failResult.error, /SMTP connection refused/);
    } finally {
        for (const [k, v] of Object.entries(savedEnv)) {
            if (v === undefined) delete process.env[k];
            else process.env[k] = v;
        }
    }
});

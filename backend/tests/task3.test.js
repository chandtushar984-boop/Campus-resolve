import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import { authorizeRoles } from "../src/middleware/role.middleware.js";
import { assignCoHead } from "../src/controllers/club.controller.js";
import {
    approveEvent,
    createEvent,
    getEventById,
    getMyClubEvents,
    getPublicEvents,
    rejectEvent,
    updateEvent,
    uploadPoster,
} from "../src/controllers/event.controller.js";
import Club from "../src/models/club.model.js";
import Event from "../src/models/event.model.js";
import User from "../src/models/user.model.js";

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

const validEventBody = () => {
    const start = new Date(Date.now() + 72 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const deadline = new Date(start.getTime() - 24 * 60 * 60 * 1000);
    return {
        title: "Tech Symposium",
        description: "Annual technical symposium",
        category: "Technical",
        venue: "Main Auditorium",
        startDateTime: start.toISOString(),
        endDateTime: end.toISOString(),
        registrationDeadline: deadline.toISOString(),
        seatCapacity: 100,
    };
};

test("Co-Head does not have Faculty or Super Admin permissions", () => {
    const facultyOnly = authorizeRoles("faculty", "admin");
    const res = createMockRes();
    let nextCalled = false;

    facultyOnly({ user: { userId: "u1", role: "co_head" } }, res, () => {
        nextCalled = true;
    });

    assert.equal(res.statusCode, 403);
    assert.equal(nextCalled, false);
});

test("assignCoHead prevents assigning the Club Head as Co-Head of the same club", async (t) => {
    const origClubFindById = Club.findById;
    const origUserFindById = User.findById;
    t.after(() => {
        Club.findById = origClubFindById;
        User.findById = origUserFindById;
    });

    const clubId = new mongoose.Types.ObjectId().toString();
    const headId = new mongoose.Types.ObjectId().toString();

    Club.findById = async () => ({
        _id: clubId,
        clubHead: headId,
        coHead: null,
    });
    User.findById = async () => ({
        _id: headId,
        name: "Priya",
        role: "club_head",
        managedClub: clubId,
    });

    const res = createMockRes();
    await assignCoHead({ params: { id: clubId }, body: { userId: headId } }, res);
    assert.equal(res.statusCode, 409);
});

test("Club Head and Co-Head can create events for their assigned club", async (t) => {
    const origClubFindOne = Club.findOne;
    const origEventCreate = Event.create;
    const origEventFindById = Event.findById;
    t.after(() => {
        Club.findOne = origClubFindOne;
        Event.create = origEventCreate;
        Event.findById = origEventFindById;
    });

    const clubId = new mongoose.Types.ObjectId();
    const headId = new mongoose.Types.ObjectId().toString();
    const coHeadId = new mongoose.Types.ObjectId().toString();

    Club.findOne = async () => ({
        _id: clubId,
        name: "AI Society",
        clubHead: headId,
        coHead: coHeadId,
    });

    Event.create = async (data) => ({ _id: new mongoose.Types.ObjectId(), ...data });
    Event.findById = (id) => ({
        populate: () => ({
            populate: () => ({
                lean: async () => ({ _id: id, title: "Tech Symposium", approvalStatus: "Pending" }),
            }),
        }),
    });

    const resHead = createMockRes();
    await createEvent(
        { body: validEventBody(), user: { userId: headId, role: "club_head" } },
        resHead
    );
    assert.equal(resHead.statusCode, 201);
    assert.equal(resHead.body.event.approvalStatus, "Pending");

    const resCoHead = createMockRes();
    await createEvent(
        { body: validEventBody(), user: { userId: coHeadId, role: "co_head" } },
        resCoHead
    );
    assert.equal(resCoHead.statusCode, 201);
    assert.equal(resCoHead.body.event.approvalStatus, "Pending");
});

test("Event validation rejects invalid dates, deadlines, and seat capacity", async (t) => {
    const origClubFindOne = Club.findOne;
    t.after(() => {
        Club.findOne = origClubFindOne;
    });

    const clubId = new mongoose.Types.ObjectId();
    const headId = new mongoose.Types.ObjectId().toString();
    Club.findOne = async () => ({ _id: clubId, clubHead: headId });

    // Start >= End
    const badDates = validEventBody();
    badDates.endDateTime = badDates.startDateTime;
    const resDates = createMockRes();
    await createEvent({ body: badDates, user: { userId: headId, role: "club_head" } }, resDates);
    assert.equal(resDates.statusCode, 400);

    // Registration deadline after start
    const badDeadline = validEventBody();
    badDeadline.registrationDeadline = badDeadline.endDateTime;
    const resDeadline = createMockRes();
    await createEvent(
        { body: badDeadline, user: { userId: headId, role: "club_head" } },
        resDeadline
    );
    assert.equal(resDeadline.statusCode, 400);

    // Non-positive seat capacity
    const badCap = validEventBody();
    badCap.seatCapacity = 0;
    const resCap = createMockRes();
    await createEvent({ body: badCap, user: { userId: headId, role: "club_head" } }, resCap);
    assert.equal(resCap.statusCode, 400);
});

test("Club Head and Co-Head can view their own club events and are blocked from other clubs", async (t) => {
    const origClubFindOne = Club.findOne;
    const origEventFind = Event.find;
    const origEventFindById = Event.findById;
    t.after(() => {
        Club.findOne = origClubFindOne;
        Event.find = origEventFind;
        Event.findById = origEventFindById;
    });

    const clubId = new mongoose.Types.ObjectId();
    const otherClubId = new mongoose.Types.ObjectId();
    const coHeadId = new mongoose.Types.ObjectId().toString();
    const outsiderId = new mongoose.Types.ObjectId().toString();

    Club.findOne = async () => ({ _id: clubId, name: "AI Society", coHead: coHeadId });

    // Cannot create event for another clubId
    const resOtherCreate = createMockRes();
    await createEvent(
        {
            body: { ...validEventBody(), clubId: otherClubId.toString() },
            user: { userId: coHeadId, role: "co_head" },
        },
        resOtherCreate
    );
    assert.equal(resOtherCreate.statusCode, 403);

    // Own club events include rejectionReason
    Event.find = () => ({
        populate: () => ({
            populate: () => ({
                sort: () => ({
                    lean: async () => [
                        { _id: "e1", title: "Demo", approvalStatus: "Rejected", rejectionReason: "Fix venue" },
                    ],
                }),
            }),
        }),
    });

    const resMyClub = createMockRes();
    await getMyClubEvents({ user: { userId: coHeadId, role: "co_head" } }, resMyClub);
    assert.equal(resMyClub.statusCode, 200);
    assert.equal(resMyClub.body.events[0].rejectionReason, "Fix venue");

    // Cannot edit another club's event
    const eventId = new mongoose.Types.ObjectId().toString();
    Event.findById = () => ({
        populate: async () => ({
            _id: eventId,
            club: { _id: otherClubId, clubHead: outsiderId, coHead: null },
        }),
    });

    const resEditForbidden = createMockRes();
    await updateEvent(
        {
            params: { id: eventId },
            body: { title: "Hijack" },
            user: { userId: coHeadId, role: "co_head" },
        },
        resEditForbidden
    );
    assert.equal(resEditForbidden.statusCode, 403);
});

test("Faculty approval detects partial venue/time overlaps and ignores cancelled events", async (t) => {
    const origFindById = Event.findById;
    const origFindOne = Event.findOne;
    t.after(() => {
        Event.findById = origFindById;
        Event.findOne = origFindOne;
    });

    const eventId = new mongoose.Types.ObjectId().toString();
    const start = new Date("2026-12-01T10:00:00Z");
    const end = new Date("2026-12-01T12:00:00Z");

    const mockEvent = {
        _id: eventId,
        title: "Workshop A",
        venue: "Main Auditorium",
        startDateTime: start,
        endDateTime: end,
        approvalStatus: "Pending",
        async save() {
            return this;
        },
    };

    mockEvent.populate = () => ({
        populate: () => ({
            populate: () => ({
                lean: async () => mockEvent,
            }),
        }),
    });

    Event.findById = (id) => (id === eventId ? mockEvent : null);

    // Conflict query verification: must check approvalStatus === "Approved" (ignoring Cancelled)
    // and use startDateTime < end && endDateTime > start
    let capturedConflictQuery = null;
    Event.findOne = (query) => {
        capturedConflictQuery = query;
        return {
            lean: async () => ({
                _id: "existing-1",
                title: "Existing Approved Event",
                venue: "Main Auditorium",
                startDateTime: new Date("2026-12-01T11:00:00Z"),
                endDateTime: new Date("2026-12-01T13:00:00Z"),
            }),
        };
    };

    const resConflict = createMockRes();
    await approveEvent(
        { params: { id: eventId }, user: { userId: "fac1", role: "faculty" } },
        resConflict
    );
    assert.equal(resConflict.statusCode, 409);
    assert.equal(capturedConflictQuery.approvalStatus, "Approved");
    assert.deepEqual(capturedConflictQuery.startDateTime, { $lt: end });
    assert.deepEqual(capturedConflictQuery.endDateTime, { $gt: start });

    // When no approved overlap exists (e.g. only cancelled events exist), approval succeeds
    Event.findOne = () => ({ lean: async () => null });
    const resApproved = createMockRes();
    await approveEvent(
        { params: { id: eventId }, user: { userId: "fac1", role: "faculty" } },
        resApproved
    );
    assert.equal(resApproved.statusCode, 200);
    assert.equal(mockEvent.approvalStatus, "Approved");
});

test("Faculty rejection stores reason and hides it from non-organizers", async (t) => {
    const origFindById = Event.findById;
    t.after(() => {
        Event.findById = origFindById;
    });

    const eventId = new mongoose.Types.ObjectId().toString();
    const headId = new mongoose.Types.ObjectId().toString();
    const studentId = new mongoose.Types.ObjectId().toString();

    const mockEvent = {
        _id: eventId,
        title: "Hackathon",
        approvalStatus: "Pending",
        rejectionReason: "",
        club: { _id: "c1", clubHead: headId, coHead: null },
        async save() {
            return this;
        },
    };

    Event.findById = () => ({
        ...mockEvent,
        save: async () => {
            mockEvent.approvalStatus = "Rejected";
            mockEvent.rejectionReason = "Venue unavailable";
            return mockEvent;
        },
        populate: () => ({
            populate: () => ({
                populate: () => ({
                    lean: async () => ({ ...mockEvent }),
                }),
            }),
        }),
    });

    // Reject without reason -> 400
    const resMissingReason = createMockRes();
    await rejectEvent(
        { params: { id: eventId }, body: { reason: "   " }, user: { userId: "fac1", role: "faculty" } },
        resMissingReason
    );
    assert.equal(resMissingReason.statusCode, 400);

    // Reject with reason -> 200
    const resRejected = createMockRes();
    await rejectEvent(
        { params: { id: eventId }, body: { reason: "Venue unavailable" }, user: { userId: "fac1", role: "faculty" } },
        resRejected
    );
    assert.equal(resRejected.statusCode, 200);

    // Student cannot view rejected event -> 403
    const resStudentView = createMockRes();
    await getEventById(
        { params: { id: eventId }, user: { userId: studentId, role: "student" } },
        resStudentView
    );
    assert.equal(resStudentView.statusCode, 403);

    // Owning Club Head can view rejected event and its rejectionReason
    const resHeadView = createMockRes();
    await getEventById(
        { params: { id: eventId }, user: { userId: headId, role: "club_head" } },
        resHeadView
    );
    assert.equal(resHeadView.statusCode, 200);
    assert.equal(resHeadView.body.event.rejectionReason, "Venue unavailable");
});

test("getPublicEvents filters exclusively for Approved events", async (t) => {
    const origFind = Event.find;
    t.after(() => {
        Event.find = origFind;
    });

    let capturedFilter = null;
    Event.find = (filter) => {
        capturedFilter = filter;
        return {
            select: () => ({
                populate: () => ({
                    populate: () => ({
                        sort: () => ({
                            lean: async () => [],
                        }),
                    }),
                }),
            }),
        };
    };

    const res = createMockRes();
    await getPublicEvents({ query: { search: "AI", category: "Technical" } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(capturedFilter.approvalStatus, "Approved");
    assert.equal(capturedFilter.category, "Technical");
});

test("uploadPoster rejects non-image magic bytes even with image dataUrl prefix", async () => {
    const fakePayload = Buffer.from("not-an-image-script").toString("base64");
    const res = createMockRes();
    await uploadPoster(
        { body: { dataUrl: `data:image/png;base64,${fakePayload}` } },
        res
    );
    assert.equal(res.statusCode, 400);
});

import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import { authorizeRoles } from "../src/middleware/role.middleware.js";
import {
    cancelRegistration,
    getMyTickets,
    markAttendance,
    registerForEvent,
    verifyTicket,
} from "../src/controllers/registration.controller.js";
import Event from "../src/models/event.model.js";
import EventRegistration from "../src/models/eventRegistration.model.js";

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

test("Student-only routes block non-student roles and organizer routes block students", () => {
    const studentOnly = authorizeRoles("student");
    const organizerOrFaculty = authorizeRoles("club_head", "co_head", "faculty", "admin");

    const res1 = createMockRes();
    let next1 = false;
    studentOnly({ user: { userId: "u1", role: "club_head" } }, res1, () => {
        next1 = true;
    });
    assert.equal(res1.statusCode, 403);
    assert.equal(next1, false);

    const res2 = createMockRes();
    let next2 = false;
    organizerOrFaculty({ user: { userId: "u2", role: "student" } }, res2, () => {
        next2 = true;
    });
    assert.equal(res2.statusCode, 403);
    assert.equal(next2, false);
});

test("registerForEvent registers student for approved event and generates QR ticket code", async (t) => {
    const origRegFindOne = EventRegistration.findOne;
    const origEventFindOneAndUpdate = Event.findOneAndUpdate;
    const origRegCreate = EventRegistration.create;

    t.after(() => {
        EventRegistration.findOne = origRegFindOne;
        Event.findOneAndUpdate = origEventFindOneAndUpdate;
        EventRegistration.create = origRegCreate;
    });

    const eventId = oid();
    const studentId = oid();

    EventRegistration.findOne = () => ({ lean: async () => null });
    Event.findOneAndUpdate = async () => ({
        _id: eventId,
        seatCapacity: 50,
        registeredCount: 46,
    });
    EventRegistration.create = async (data) => ({
        _id: oid(),
        ...data,
    });

    const res = createMockRes();
    await registerForEvent(
        { params: { id: eventId }, user: { userId: studentId, role: "student" } },
        res
    );

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.success, true);
    assert.match(res.body.registration.ticketCode, /^TKT-[A-F0-9]{12}$/);
    assert.equal(res.body.seatSummary.registeredCount, 46);
    assert.equal(res.body.seatSummary.seatCapacity, 50);
});

test("registerForEvent rejects unapproved, expired deadline, and full events", async (t) => {
    const origRegFindOne = EventRegistration.findOne;
    const origEventFindOneAndUpdate = Event.findOneAndUpdate;
    const origEventFindById = Event.findById;

    t.after(() => {
        EventRegistration.findOne = origRegFindOne;
        Event.findOneAndUpdate = origEventFindOneAndUpdate;
        Event.findById = origEventFindById;
    });

    const eventId = oid();
    const studentId = oid();

    EventRegistration.findOne = () => ({ lean: async () => null });
    Event.findOneAndUpdate = async () => null;

    // 1. Pending event
    Event.findById = () => ({
        lean: async () => ({ _id: eventId, approvalStatus: "Pending" }),
    });
    const resPending = createMockRes();
    await registerForEvent(
        { params: { id: eventId }, user: { userId: studentId, role: "student" } },
        resPending
    );
    assert.equal(resPending.statusCode, 400);

    // 2. Passed deadline
    const past = new Date(Date.now() - 60 * 60 * 1000);
    const future = new Date(Date.now() + 2 * 60 * 60 * 1000);
    Event.findById = () => ({
        lean: async () => ({
            _id: eventId,
            approvalStatus: "Approved",
            registrationDeadline: past,
            endDateTime: future,
            seatCapacity: 50,
            registeredCount: 10,
        }),
    });
    const resDeadline = createMockRes();
    await registerForEvent(
        { params: { id: eventId }, user: { userId: studentId, role: "student" } },
        resDeadline
    );
    assert.equal(resDeadline.statusCode, 400);

    // 3. Full capacity
    Event.findById = () => ({
        lean: async () => ({
            _id: eventId,
            approvalStatus: "Approved",
            registrationDeadline: future,
            endDateTime: future,
            seatCapacity: 50,
            registeredCount: 50,
        }),
    });
    const resFull = createMockRes();
    await registerForEvent(
        { params: { id: eventId }, user: { userId: studentId, role: "student" } },
        resFull
    );
    assert.equal(resFull.statusCode, 409);
});

test("Concurrent registrations for the last seat allow only one winner", async (t) => {
    const origRegFindOne = EventRegistration.findOne;
    const origEventFindOneAndUpdate = Event.findOneAndUpdate;
    const origEventFindById = Event.findById;
    const origRegCreate = EventRegistration.create;

    t.after(() => {
        EventRegistration.findOne = origRegFindOne;
        Event.findOneAndUpdate = origEventFindOneAndUpdate;
        Event.findById = origEventFindById;
        EventRegistration.create = origRegCreate;
    });

    const eventId = oid();
    const s1 = oid();
    const s2 = oid();
    let seatsTaken = 49;
    const seatCapacity = 50;
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);

    EventRegistration.findOne = () => ({ lean: async () => null });
    Event.findOneAndUpdate = async () => {
        // Atomic check-and-increment simulation
        if (seatsTaken < seatCapacity) {
            seatsTaken += 1;
            return { _id: eventId, seatCapacity, registeredCount: seatsTaken };
        }
        return null;
    };
    Event.findById = () => ({
        lean: async () => ({
            _id: eventId,
            approvalStatus: "Approved",
            registrationDeadline: future,
            endDateTime: future,
            seatCapacity,
            registeredCount: seatsTaken,
        }),
    });
    EventRegistration.create = async (data) => ({ _id: oid(), ...data });

    const res1 = createMockRes();
    const res2 = createMockRes();
    await Promise.all([
        registerForEvent({ params: { id: eventId }, user: { userId: s1, role: "student" } }, res1),
        registerForEvent({ params: { id: eventId }, user: { userId: s2, role: "student" } }, res2),
    ]);

    const statuses = [res1.statusCode, res2.statusCode].sort();
    assert.deepEqual(statuses, [201, 409]);
    assert.equal(seatsTaken, 50);
});

test("Duplicate registration from unique index (11000) rolls back seat increment", async (t) => {
    const origRegFindOne = EventRegistration.findOne;
    const origEventFindOneAndUpdate = Event.findOneAndUpdate;
    const origEventUpdateOne = Event.updateOne;
    const origRegCreate = EventRegistration.create;

    t.after(() => {
        EventRegistration.findOne = origRegFindOne;
        Event.findOneAndUpdate = origEventFindOneAndUpdate;
        Event.updateOne = origEventUpdateOne;
        EventRegistration.create = origRegCreate;
    });

    const eventId = oid();
    const studentId = oid();
    let rolledBack = false;

    EventRegistration.findOne = () => ({ lean: async () => null });
    Event.findOneAndUpdate = async () => ({
        _id: eventId,
        seatCapacity: 50,
        registeredCount: 11,
    });
    EventRegistration.create = async () => {
        const err = new Error("E11000 duplicate key error");
        err.code = 11000;
        throw err;
    };
    Event.updateOne = async (_query, update) => {
        if (update?.$inc?.registeredCount === -1) {
            rolledBack = true;
        }
        return { modifiedCount: 1 };
    };

    const res = createMockRes();
    await registerForEvent(
        { params: { id: eventId }, user: { userId: studentId, role: "student" } },
        res
    );

    assert.equal(res.statusCode, 409);
    assert.equal(rolledBack, true);
});

test("verifyTicket enforces club authorization, event match, validity, and prevents duplicate check-in", async (t) => {
    const origEventFindById = Event.findById;
    const origRegFindOne = EventRegistration.findOne;
    const origRegFindOneAndUpdate = EventRegistration.findOneAndUpdate;

    t.after(() => {
        Event.findById = origEventFindById;
        EventRegistration.findOne = origRegFindOne;
        EventRegistration.findOneAndUpdate = origRegFindOneAndUpdate;
    });

    const eventId = oid();
    const otherEventId = oid();
    const headId = oid();
    const otherHeadId = oid();

    Event.findById = () => ({
        populate: () => ({
            lean: async () => ({
                _id: eventId,
                approvalStatus: "Approved",
                club: { _id: oid(), clubHead: headId, coHead: null },
            }),
        }),
    });

    // 1. Other club's head is forbidden
    const resForbidden = createMockRes();
    await verifyTicket(
        {
            params: { id: eventId },
            body: { ticketCode: "TKT-ABC123" },
            user: { userId: otherHeadId, role: "club_head" },
        },
        resForbidden
    );
    assert.equal(resForbidden.statusCode, 403);

    // 2. Ticket belongs to another event
    EventRegistration.findOne = () => ({
        populate: () => ({
            lean: async () => ({
                _id: oid(),
                event: otherEventId,
                status: "Registered",
                attendanceStatus: "Registered",
            }),
        }),
    });
    const resWrongEvent = createMockRes();
    await verifyTicket(
        {
            params: { id: eventId },
            body: { ticketCode: "TKT-ABC123" },
            user: { userId: headId, role: "club_head" },
        },
        resWrongEvent
    );
    assert.equal(resWrongEvent.statusCode, 400);

    // 3. Already checked in -> 409
    EventRegistration.findOne = () => ({
        populate: () => ({
            lean: async () => ({
                _id: oid(),
                event: eventId,
                status: "Registered",
                attendanceStatus: "Attended",
            }),
        }),
    });
    const resDuplicateCheckIn = createMockRes();
    await verifyTicket(
        {
            params: { id: eventId },
            body: { ticketCode: "TKT-ABC123" },
            user: { userId: headId, role: "club_head" },
        },
        resDuplicateCheckIn
    );
    assert.equal(resDuplicateCheckIn.statusCode, 409);

    // 4. Valid check-in succeeds
    const regId = oid();
    EventRegistration.findOne = () => ({
        populate: () => ({
            lean: async () => ({
                _id: regId,
                event: eventId,
                status: "Registered",
                attendanceStatus: "Registered",
            }),
        }),
    });
    EventRegistration.findOneAndUpdate = () => ({
        populate: () => ({
            populate: async () => ({
                _id: regId,
                event: eventId,
                status: "Registered",
                attendanceStatus: "Attended",
            }),
        }),
    });
    const resOk = createMockRes();
    await verifyTicket(
        {
            params: { id: eventId },
            body: { ticketCode: "TKT-ABC123" },
            user: { userId: headId, role: "club_head" },
        },
        resOk
    );
    assert.equal(resOk.statusCode, 200);
    assert.equal(resOk.body.registration.attendanceStatus, "Attended");
});

test("markAttendance prevents duplicate check-in and cannot reset Attended to Absent or Registered", async (t) => {
    const origEventFindById = Event.findById;
    const origRegFindOne = EventRegistration.findOne;
    const origRegFindOneAndUpdate = EventRegistration.findOneAndUpdate;

    t.after(() => {
        Event.findById = origEventFindById;
        EventRegistration.findOne = origRegFindOne;
        EventRegistration.findOneAndUpdate = origRegFindOneAndUpdate;
    });

    const eventId = oid();
    const regId = oid();
    const facultyId = oid();

    Event.findById = () => ({
        populate: () => ({
            lean: async () => ({
                _id: eventId,
                club: { _id: oid(), clubHead: oid(), coHead: null },
            }),
        }),
    });

    let updateCalled = false;
    EventRegistration.findOneAndUpdate = () => {
        updateCalled = true;
        return {
            populate: () => ({
                populate: async () => null,
            }),
        };
    };

    EventRegistration.findOne = async () => ({
        _id: regId,
        event: eventId,
        status: "Registered",
        attendanceStatus: "Attended",
    });

    for (const targetStatus of ["Attended", "Absent", "Registered"]) {
        const res = createMockRes();
        await markAttendance(
            {
                params: { id: eventId, registrationId: regId },
                body: { attendanceStatus: targetStatus },
                user: { userId: facultyId, role: "faculty" },
            },
            res
        );
        assert.equal(res.statusCode, 409);
        assert.equal(updateCalled, false);
    }
});

test("markAttendance uses conditional atomic update and handles concurrent verifyTicket check-in race", async (t) => {
    const origEventFindById = Event.findById;
    const origRegFindOne = EventRegistration.findOne;
    const origRegFindOneAndUpdate = EventRegistration.findOneAndUpdate;

    t.after(() => {
        Event.findById = origEventFindById;
        EventRegistration.findOne = origRegFindOne;
        EventRegistration.findOneAndUpdate = origRegFindOneAndUpdate;
    });

    const eventId = oid();
    const regId = oid();
    const facultyId = oid();

    Event.findById = () => ({
        populate: () => ({
            lean: async () => ({
                _id: eventId,
                club: { _id: oid(), clubHead: oid(), coHead: null },
            }),
        }),
    });

    // Initial read sees Registered before concurrent verifyTicket checks the student in
    EventRegistration.findOne = async () => ({
        _id: regId,
        event: eventId,
        status: "Registered",
        attendanceStatus: "Registered",
    });

    let capturedFilter = null;
    let capturedUpdate = null;

    // 1. Concurrent race: findOneAndUpdate returns null because attendanceStatus is now Attended
    EventRegistration.findOneAndUpdate = (filter, update) => {
        capturedFilter = filter;
        capturedUpdate = update;
        return {
            populate: () => ({
                populate: async () => null,
            }),
        };
    };

    const raceRes = createMockRes();
    await markAttendance(
        {
            params: { id: eventId, registrationId: regId },
            body: { attendanceStatus: "Absent" },
            user: { userId: facultyId, role: "faculty" },
        },
        raceRes
    );

    assert.equal(raceRes.statusCode, 409);
    assert.deepEqual(capturedFilter.attendanceStatus, { $ne: "Attended" });
    assert.equal(capturedUpdate.$set.attendanceStatus, "Absent");
    assert.equal(capturedUpdate.$set.checkedInAt, null);
    assert.equal(capturedUpdate.$set.checkedInBy, null);

    // 2. Permitted transition (Registered -> Absent) succeeds atomically
    EventRegistration.findOneAndUpdate = () => ({
        populate: () => ({
            populate: async () => ({
                _id: regId,
                event: eventId,
                status: "Registered",
                attendanceStatus: "Absent",
                checkedInAt: null,
                checkedInBy: null,
            }),
        }),
    });

    const okRes = createMockRes();
    await markAttendance(
        {
            params: { id: eventId, registrationId: regId },
            body: { attendanceStatus: "Absent" },
            user: { userId: facultyId, role: "faculty" },
        },
        okRes
    );

    assert.equal(okRes.statusCode, 200);
    assert.equal(okRes.body.registration.attendanceStatus, "Absent");
    assert.equal(okRes.body.registration.checkedInAt, null);
    assert.equal(okRes.body.registration.checkedInBy, null);
});

test("cancelRegistration enforces ownership, event start rules, and releases seat", async (t) => {
    const origRegFindById = EventRegistration.findById;
    const origEventFindById = Event.findById;
    const origRegFindOneAndUpdate = EventRegistration.findOneAndUpdate;
    const origEventUpdateOne = Event.updateOne;

    t.after(() => {
        EventRegistration.findById = origRegFindById;
        Event.findById = origEventFindById;
        EventRegistration.findOneAndUpdate = origRegFindOneAndUpdate;
        Event.updateOne = origEventUpdateOne;
    });

    const regId = oid();
    const eventId = oid();
    const studentId = oid();
    const otherStudentId = oid();
    let seatReleased = false;

    EventRegistration.findById = async () => ({
        _id: regId,
        event: eventId,
        student: studentId,
        status: "Registered",
        attendanceStatus: "Registered",
    });

    // 1. Other student cannot cancel -> 403
    const resOther = createMockRes();
    await cancelRegistration(
        { params: { id: regId }, user: { userId: otherStudentId, role: "student" } },
        resOther
    );
    assert.equal(resOther.statusCode, 403);

    // 2. Event already started -> 400
    Event.findById = () => ({
        lean: async () => ({
            _id: eventId,
            approvalStatus: "Approved",
            startDateTime: new Date(Date.now() - 60 * 1000),
        }),
    });
    const resStarted = createMockRes();
    await cancelRegistration(
        { params: { id: regId }, user: { userId: studentId, role: "student" } },
        resStarted
    );
    assert.equal(resStarted.statusCode, 400);

    // 3. Valid cancellation releases seat
    Event.findById = () => ({
        lean: async () => ({
            _id: eventId,
            approvalStatus: "Approved",
            startDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        }),
    });
    EventRegistration.findOneAndUpdate = async () => ({
        _id: regId,
        status: "Cancelled",
    });
    Event.updateOne = async (_query, update) => {
        if (update?.$inc?.registeredCount === -1) {
            seatReleased = true;
        }
        return { modifiedCount: 1 };
    };

    const resOk = createMockRes();
    await cancelRegistration(
        { params: { id: regId }, user: { userId: studentId, role: "student" } },
        resOk
    );
    assert.equal(resOk.statusCode, 200);
    assert.equal(seatReleased, true);
});

test("getMyTickets returns student registrations", async (t) => {
    const origRegFind = EventRegistration.find;
    t.after(() => {
        EventRegistration.find = origRegFind;
    });

    const studentId = oid();
    EventRegistration.find = () => ({
        populate: () => ({
            sort: () => ({
                lean: async () => [
                    { _id: oid(), ticketCode: "TKT-112233445566", status: "Registered" },
                ],
            }),
        }),
    });

    const res = createMockRes();
    await getMyTickets({ user: { userId: studentId, role: "student" } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.tickets.length, 1);
});

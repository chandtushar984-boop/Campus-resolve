import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import { authorizeRoles, isFacultyRole } from "../src/middleware/role.middleware.js";
import { registerUser, demoLogin } from "../src/controllers/auth.controller.js";
import {
    createClub,
    updateClub,
    joinClub,
    leaveClub,
    getClubAnnouncements,
    createClubAnnouncement,
} from "../src/controllers/club.controller.js";
import User from "../src/models/user.model.js";
import Club from "../src/models/club.model.js";
import ClubMembership from "../src/models/clubMembership.model.js";
import ClubAnnouncement from "../src/models/clubAnnouncement.model.js";

const createMockRes = () => {
    const res = {
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
    };
    return res;
};

test("isFacultyRole & authorizeRoles enforce role permissions", () => {
    assert.equal(isFacultyRole("faculty"), true);
    assert.equal(isFacultyRole("admin"), true);
    assert.equal(isFacultyRole("club_head"), false);
    assert.equal(isFacultyRole("student"), false);

    const facultyOnly = authorizeRoles("faculty");

    // Unauthenticated
    const res401 = createMockRes();
    let called = false;
    facultyOnly({ user: null }, res401, () => {
        called = true;
    });
    assert.equal(res401.statusCode, 401);
    assert.equal(called, false);

    // Student blocked
    const res403 = createMockRes();
    facultyOnly({ user: { userId: "1", role: "student" } }, res403, () => {
        called = true;
    });
    assert.equal(res403.statusCode, 403);
    assert.equal(called, false);

    // Faculty allowed
    const res200 = createMockRes();
    facultyOnly({ user: { userId: "2", role: "faculty" } }, res200, () => {
        called = true;
    });
    assert.equal(called, true);
});

test("registerUser validates university email and forces student role", async (t) => {
    const origFindOne = User.findOne;
    const origCreate = User.create;
    t.after(() => {
        User.findOne = origFindOne;
        User.create = origCreate;
    });

    // Reject mismatched email & rollNo
    const resBad = createMockRes();
    await registerUser(
        {
            body: {
                name: "Test",
                email: "2301010002@krmu.edu.in",
                password: "password123",
                rollNo: "2301010001",
                course: "B.Tech CSE",
                semester: "5th",
            },
        },
        resBad
    );
    assert.equal(resBad.statusCode, 400);

    // Force student role even if faculty is passed
    let createdPayload = null;
    User.findOne = async () => null;
    User.create = async (data) => {
        createdPayload = data;
        return data;
    };

    const resOk = createMockRes();
    await registerUser(
        {
            body: {
                name: "Test Student",
                email: "2301010001@krmu.edu.in",
                password: "password123",
                rollNo: "2301010001",
                course: "B.Tech CSE",
                semester: "5th",
                role: "faculty",
            },
        },
        resOk
    );
    assert.equal(resOk.statusCode, 201);
    assert.equal(createdPayload.role, "student");
});

test("demoLogin respects environment gating and queries only isDemo accounts", async (t) => {
    const origFindOne = User.findOne;
    const origEnv = process.env.NODE_ENV;
    const origDemoFlag = process.env.ENABLE_DEMO_LOGIN;
    const origSecret = process.env.JWT_SECRET;

    t.after(() => {
        User.findOne = origFindOne;
        process.env.NODE_ENV = origEnv;
        process.env.ENABLE_DEMO_LOGIN = origDemoFlag;
        process.env.JWT_SECRET = origSecret;
    });

    process.env.JWT_SECRET = "test-secret";
    process.env.NODE_ENV = "production";
    process.env.ENABLE_DEMO_LOGIN = "false";

    const resDisabled = createMockRes();
    await demoLogin({ body: { role: "student" } }, resDisabled);
    assert.equal(resDisabled.statusCode, 403);

    process.env.ENABLE_DEMO_LOGIN = "true";
    const resInvalidRole = createMockRes();
    await demoLogin({ body: { role: "admin" } }, resInvalidRole);
    assert.equal(resInvalidRole.statusCode, 400);

    let capturedQuery = null;
    User.findOne = (query) => {
        capturedQuery = query;
        return {
            populate: async () => ({
                _id: new mongoose.Types.ObjectId(),
                name: "Demo Student",
                email: "2301010099@krmu.edu.in",
                role: "student",
                isDemo: true,
            }),
        };
    };

    const resOk = createMockRes();
    await demoLogin({ body: { role: "student" } }, resOk);
    assert.equal(resOk.statusCode, 200);
    assert.deepEqual(capturedQuery, { role: "student", isDemo: true });
    assert.ok(resOk.body.token);
});

test("updateClub enforces assigned Club Head ownership", async (t) => {
    const origClubFindById = Club.findById;
    const origClubFindOne = Club.findOne;
    const origCount = ClubMembership.countDocuments;
    t.after(() => {
        Club.findById = origClubFindById;
        Club.findOne = origClubFindOne;
        ClubMembership.countDocuments = origCount;
    });

    const clubId = new mongoose.Types.ObjectId().toString();
    const assignedHeadId = new mongoose.Types.ObjectId().toString();
    const otherHeadId = new mongoose.Types.ObjectId().toString();

    const mockClub = {
        _id: clubId,
        name: "AI Society",
        description: "Desc",
        category: "Technical",
        clubHead: assignedHeadId,
        async save() {
            return this;
        },
    };
    mockClub.populate = () => ({
        populate: () => ({ lean: async () => mockClub }),
    });

    Club.findById = (id) => (id === clubId ? mockClub : null);
    Club.findOne = async () => null;
    ClubMembership.countDocuments = async () => 5;

    // Different club_head must be rejected with 403
    const resForbidden = createMockRes();
    await updateClub(
        {
            params: { id: clubId },
            body: { description: "Hijack" },
            user: { userId: otherHeadId, role: "club_head" },
        },
        resForbidden
    );
    assert.equal(resForbidden.statusCode, 403);

    // Assigned club_head succeeds
    const resAllowed = createMockRes();
    await updateClub(
        {
            params: { id: clubId },
            body: { description: "Updated description" },
            user: { userId: assignedHeadId, role: "club_head" },
        },
        resAllowed
    );
    assert.equal(resAllowed.statusCode, 200);
    assert.equal(mockClub.description, "Updated description");
});

test("joinClub prevents duplicate membership and leaveClub blocks assigned head", async (t) => {
    const origClubFindById = Club.findById;
    const origMemFindOne = ClubMembership.findOne;
    t.after(() => {
        Club.findById = origClubFindById;
        ClubMembership.findOne = origMemFindOne;
    });

    const clubId = new mongoose.Types.ObjectId().toString();
    const userId = new mongoose.Types.ObjectId().toString();

    Club.findById = async () => ({ _id: clubId, name: "AI Club", isActive: true, clubHead: userId });
    ClubMembership.findOne = async () => ({ _id: "m1", club: clubId, user: userId });

    const resDup = createMockRes();
    await joinClub({ params: { id: clubId }, user: { userId, role: "student" } }, resDup);
    assert.equal(resDup.statusCode, 409);

    const resHeadLeave = createMockRes();
    await leaveClub({ params: { id: clubId }, user: { userId, role: "club_head" } }, resHeadLeave);
    assert.equal(resHeadLeave.statusCode, 400);
});

test("announcements require membership to read and club ownership to post", async (t) => {
    const origClubFindById = Club.findById;
    const origMemFindOne = ClubMembership.findOne;
    const origAnnCreate = ClubAnnouncement.create;
    t.after(() => {
        Club.findById = origClubFindById;
        ClubMembership.findOne = origMemFindOne;
        ClubAnnouncement.create = origAnnCreate;
    });

    const clubId = new mongoose.Types.ObjectId().toString();
    const headId = new mongoose.Types.ObjectId().toString();
    const outsiderId = new mongoose.Types.ObjectId().toString();

    Club.findById = async () => ({ _id: clubId, clubHead: headId });
    ClubMembership.findOne = async () => null;

    // Non-member student cannot view announcements
    const resReadDenied = createMockRes();
    await getClubAnnouncements(
        { params: { id: clubId }, user: { userId: outsiderId, role: "student" } },
        resReadDenied
    );
    assert.equal(resReadDenied.statusCode, 403);

    // Other club head cannot post announcement
    const resPostDenied = createMockRes();
    await createClubAnnouncement(
        {
            params: { id: clubId },
            body: { title: "Notice", content: "Hello" },
            user: { userId: outsiderId, role: "club_head" },
        },
        resPostDenied
    );
    assert.equal(resPostDenied.statusCode, 403);

    // createClub rejects invalid category
    const resBadCat = createMockRes();
    await createClub(
        {
            body: { name: "Test", description: "Desc", category: "InvalidCat" },
            user: { userId: headId, role: "faculty" },
        },
        resBadCat
    );
    assert.equal(resBadCat.statusCode, 400);
});

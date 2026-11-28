import express from "express";
import {
    approveEvent,
    cancelEvent,
    createEvent,
    getEventById,
    getManagedEvents,
    getMyClubEvents,
    getPublicEvents,
    rejectEvent,
    updateEvent,
    uploadPoster,
} from "../controllers/event.controller.js";
import {
    exportEventRegistrationsCsv,
    getEventRegistrations,
    getMyRegistrationForEvent,
    markAttendance,
    registerForEvent,
    verifyTicket,
} from "../controllers/registration.controller.js";
import {
    getEventReviews,
    submitEventReview,
} from "../controllers/review.controller.js";
import { auth, optionalAuth } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

// Poster upload (Club Head, Co-Head, Faculty)
router.post(
    "/upload-poster",
    auth,
    authorizeRoles("club_head", "co_head", "faculty", "admin"),
    uploadPoster
);

// Public approved event discovery
router.get("/", optionalAuth, getPublicEvents);

// Organizer & Faculty management listings (must precede /:id)
router.get(
    "/my-club",
    auth,
    authorizeRoles("club_head", "co_head"),
    getMyClubEvents
);
router.get(
    "/manage",
    auth,
    authorizeRoles("faculty", "admin"),
    getManagedEvents
);

// Create event (Club Head or Co-Head only)
router.post(
    "/",
    auth,
    authorizeRoles("club_head", "co_head"),
    createEvent
);

// Single event & updates
router.get("/:id", optionalAuth, getEventById);
router.put(
    "/:id",
    auth,
    authorizeRoles("club_head", "co_head", "faculty", "admin"),
    updateEvent
);
router.patch(
    "/:id/cancel",
    auth,
    authorizeRoles("club_head", "co_head", "faculty", "admin"),
    cancelEvent
);

// Faculty approval actions
router.patch(
    "/:id/approve",
    auth,
    authorizeRoles("faculty", "admin"),
    approveEvent
);
router.patch(
    "/:id/reject",
    auth,
    authorizeRoles("faculty", "admin"),
    rejectEvent
);

// Event registration, ticketing & attendance
router.get(
    "/:id/my-registration",
    auth,
    authorizeRoles("student"),
    getMyRegistrationForEvent
);
router.post(
    "/:id/register",
    auth,
    authorizeRoles("student"),
    registerForEvent
);
router.get(
    "/:id/registrations",
    auth,
    authorizeRoles("club_head", "co_head", "faculty", "admin"),
    getEventRegistrations
);
router.get(
    "/:id/export-csv",
    auth,
    authorizeRoles("club_head", "co_head", "faculty", "admin"),
    exportEventRegistrationsCsv
);
router.post(
    "/:id/verify-ticket",
    auth,
    authorizeRoles("club_head", "co_head", "faculty", "admin"),
    verifyTicket
);
router.patch(
    "/:id/registrations/:registrationId/attendance",
    auth,
    authorizeRoles("club_head", "co_head", "faculty", "admin"),
    markAttendance
);

// Event reviews & ratings
router.get("/:id/reviews", optionalAuth, getEventReviews);
router.post("/:id/reviews", auth, authorizeRoles("student"), submitEventReview);

export default router;

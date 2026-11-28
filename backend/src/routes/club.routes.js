import express from "express";
import {
    assignClubHead,
    assignCoHead,
    createClub,
    createClubAnnouncement,
    deleteClubAnnouncement,
    getAllClubs,
    getClubAnnouncements,
    getClubById,
    getClubMembers,
    getMyClubs,
    joinClub,
    leaveClub,
    updateClub,
    updateClubAnnouncement,
} from "../controllers/club.controller.js";
import { auth } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

// Directory & My Clubs
router.get("/", auth, getAllClubs);
router.get("/my-clubs", auth, getMyClubs);
router.post("/", auth, authorizeRoles("faculty", "admin"), createClub);

// Single Club & Management
router.get("/:id", auth, getClubById);
router.put("/:id", auth, authorizeRoles("club_head", "co_head", "faculty", "admin"), updateClub);
router.patch("/:id/assign-head", auth, authorizeRoles("faculty", "admin"), assignClubHead);
router.patch("/:id/assign-co-head", auth, authorizeRoles("faculty", "admin"), assignCoHead);

// Membership
router.post("/:id/join", auth, joinClub);
router.delete("/:id/leave", auth, leaveClub);
router.get("/:id/members", auth, getClubMembers);

// Announcements
router.get("/:id/announcements", auth, getClubAnnouncements);
router.post("/:id/announcements", auth, authorizeRoles("club_head", "co_head", "faculty", "admin"), createClubAnnouncement);
router.put("/:id/announcements/:announcementId", auth, authorizeRoles("club_head", "co_head", "faculty", "admin"), updateClubAnnouncement);
router.delete("/:id/announcements/:announcementId", auth, authorizeRoles("club_head", "co_head", "faculty", "admin"), deleteClubAnnouncement);

export default router;

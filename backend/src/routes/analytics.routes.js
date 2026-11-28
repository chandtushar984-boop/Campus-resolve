import express from "express";
import {
    getClubHeadAnalytics,
    getFacultyAnalytics,
    getStudentAnalytics,
} from "../controllers/analytics.controller.js";
import { auth } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

router.get("/student", auth, authorizeRoles("student"), getStudentAnalytics);
router.get(
    "/club-head",
    auth,
    authorizeRoles("club_head", "co_head"),
    getClubHeadAnalytics
);
router.get(
    "/faculty",
    auth,
    authorizeRoles("faculty", "admin"),
    getFacultyAnalytics
);

export default router;

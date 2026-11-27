import express from "express";
import {
    cancelRegistration,
    getMyTickets,
} from "../controllers/registration.controller.js";
import { auth } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

router.get("/my-tickets", auth, authorizeRoles("student"), getMyTickets);
router.patch("/:id/cancel", auth, authorizeRoles("student"), cancelRegistration);

export default router;

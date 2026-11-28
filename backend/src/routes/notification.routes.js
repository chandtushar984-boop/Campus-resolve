import express from "express";
import {
    getMyNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
} from "../controllers/notification.controller.js";
import { auth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", auth, getMyNotifications);
router.patch("/read-all", auth, markAllNotificationsAsRead);
router.patch("/:id/read", auth, markNotificationAsRead);

export default router;

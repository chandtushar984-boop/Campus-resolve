import mongoose from "mongoose";
import Notification from "../models/notification.model.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getMyNotifications = async (req, res) => {
    try {
        const userId = req.user.userId;
        const [notifications, unreadCount] = await Promise.all([
            Notification.find({ recipient: userId })
                .sort({ createdAt: -1 })
                .limit(50)
                .lean(),
            Notification.countDocuments({ recipient: userId, read: false }),
        ]);

        return res.status(200).json({
            success: true,
            notifications,
            unreadCount,
        });
    } catch {
        return res.status(500).json({
            success: false,
            message: "Failed to load notifications.",
        });
    }
};

const markNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification ID.",
            });
        }

        const notification = await Notification.findById(id);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found.",
            });
        }

        if (notification.recipient.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You can only update your own notifications.",
            });
        }

        if (!notification.read) {
            notification.read = true;
            notification.readAt = new Date();
            await notification.save();
        }

        return res.status(200).json({
            success: true,
            notification,
        });
    } catch {
        return res.status(500).json({
            success: false,
            message: "Failed to update notification.",
        });
    }
};

const markAllNotificationsAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user.userId, read: false },
            { $set: { read: true, readAt: new Date() } }
        );

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read.",
        });
    } catch {
        return res.status(500).json({
            success: false,
            message: "Failed to mark notifications as read.",
        });
    }
};

export {
    getMyNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
};

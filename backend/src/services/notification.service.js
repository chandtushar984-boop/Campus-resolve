import Notification from "../models/notification.model.js";

const createNotification = async ({
    recipient,
    type,
    title,
    message,
    link = "",
    relatedEvent = null,
    relatedClub = null,
    relatedAnnouncement = null,
}) => {
    if (!recipient) return null;
    try {
        return await Notification.create({
            recipient,
            type,
            title,
            message,
            link,
            relatedEvent,
            relatedClub,
            relatedAnnouncement,
        });
    } catch {
        return null;
    }
};

const createNotificationsForUsers = async (
    recipientIds,
    {
        type,
        title,
        message,
        link = "",
        relatedEvent = null,
        relatedClub = null,
        relatedAnnouncement = null,
    }
) => {
    const uniqueIds = [
        ...new Set(
            (recipientIds || [])
                .filter(Boolean)
                .map((id) => id.toString())
        ),
    ];

    if (uniqueIds.length === 0) return [];

    try {
        return await Notification.insertMany(
            uniqueIds.map((recipient) => ({
                recipient,
                type,
                title,
                message,
                link,
                relatedEvent,
                relatedClub,
                relatedAnnouncement,
            }))
        );
    } catch {
        return [];
    }
};

export { createNotification, createNotificationsForUsers };

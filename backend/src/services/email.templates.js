const escapeHtml = (value) =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

const formatDate = (date) => {
    if (!date) return "TBA";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "TBA";
    return parsed.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export const registrationConfirmationTemplate = ({
    studentName,
    eventTitle,
    venue,
    startDateTime,
    ticketCode,
}) => {
    const safeName = escapeHtml(studentName || "Student");
    const safeTitle = escapeHtml(eventTitle);
    const safeVenue = escapeHtml(venue);
    const dateStr = formatDate(startDateTime);
    const safeTicket = escapeHtml(ticketCode);

    return {
        subject: `Registration Confirmed: ${eventTitle}`,
        text: `Hi ${studentName || "Student"},\n\nYour registration for "${eventTitle}" is confirmed.\nDate & Time: ${dateStr}\nVenue: ${venue}\nTicket ID: ${ticketCode}\n\nPlease present your QR ticket at the venue.\n\n- CampusResolve`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1e293b;">
                <h2 style="color: #4f46e5;">Registration Confirmed</h2>
                <p>Hi ${safeName},</p>
                <p>Your registration for <strong>${safeTitle}</strong> is confirmed.</p>
                <ul>
                    <li><strong>Date &amp; Time:</strong> ${escapeHtml(dateStr)}</li>
                    <li><strong>Venue:</strong> ${safeVenue}</li>
                    <li><strong>Ticket ID:</strong> <code>${safeTicket}</code></li>
                </ul>
                <p>Please present your QR ticket from the My Tickets page at the venue.</p>
                <p style="color: #64748b; font-size: 12px;">CampusResolve</p>
            </div>
        `,
    };
};

export const eventApprovedTemplate = ({
    organizerName,
    eventTitle,
    venue,
    startDateTime,
}) => {
    const safeName = escapeHtml(organizerName || "Organizer");
    const safeTitle = escapeHtml(eventTitle);
    const safeVenue = escapeHtml(venue);
    const dateStr = formatDate(startDateTime);

    return {
        subject: `Event Approved: ${eventTitle}`,
        text: `Hi ${organizerName || "Organizer"},\n\nYour event "${eventTitle}" has been approved by Faculty.\nDate & Time: ${dateStr}\nVenue: ${venue}\n\nStudents can now view and register for this event.\n\n- CampusResolve`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1e293b;">
                <h2 style="color: #059669;">Event Approved</h2>
                <p>Hi ${safeName},</p>
                <p>Your event <strong>${safeTitle}</strong> has been approved by Faculty.</p>
                <ul>
                    <li><strong>Date &amp; Time:</strong> ${escapeHtml(dateStr)}</li>
                    <li><strong>Venue:</strong> ${safeVenue}</li>
                </ul>
                <p>Students can now view and register for this event.</p>
                <p style="color: #64748b; font-size: 12px;">CampusResolve</p>
            </div>
        `,
    };
};

export const eventRejectedTemplate = ({
    organizerName,
    eventTitle,
    reason,
}) => {
    const safeName = escapeHtml(organizerName || "Organizer");
    const safeTitle = escapeHtml(eventTitle);
    const safeReason = escapeHtml(reason || "No reason provided.");

    return {
        subject: `Event Rejected: ${eventTitle}`,
        text: `Hi ${organizerName || "Organizer"},\n\nYour event proposal "${eventTitle}" was rejected.\nReason: ${reason || "No reason provided."}\n\nYou may update the event details and resubmit for review.\n\n- CampusResolve`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1e293b;">
                <h2 style="color: #dc2626;">Event Rejected</h2>
                <p>Hi ${safeName},</p>
                <p>Your event proposal <strong>${safeTitle}</strong> was rejected.</p>
                <p><strong>Reason:</strong> ${safeReason}</p>
                <p>You may update the event details and resubmit for review.</p>
                <p style="color: #64748b; font-size: 12px;">CampusResolve</p>
            </div>
        `,
    };
};

export const eventCancelledTemplate = ({
    recipientName,
    eventTitle,
    venue,
    startDateTime,
}) => {
    const safeName = escapeHtml(recipientName || "Student");
    const safeTitle = escapeHtml(eventTitle);
    const safeVenue = escapeHtml(venue);
    const dateStr = formatDate(startDateTime);

    return {
        subject: `Event Cancelled: ${eventTitle}`,
        text: `Hi ${recipientName || "Student"},\n\nThe event "${eventTitle}" scheduled for ${dateStr} at ${venue} has been cancelled.\n\n- CampusResolve`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1e293b;">
                <h2 style="color: #dc2626;">Event Cancelled</h2>
                <p>Hi ${safeName},</p>
                <p>The event <strong>${safeTitle}</strong> scheduled for ${escapeHtml(dateStr)} at ${safeVenue} has been cancelled.</p>
                <p style="color: #64748b; font-size: 12px;">CampusResolve</p>
            </div>
        `,
    };
};

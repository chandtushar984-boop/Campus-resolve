import nodemailer from "nodemailer";
import {
    eventApprovedTemplate,
    eventCancelledTemplate,
    eventRejectedTemplate,
    registrationConfirmationTemplate,
} from "./email.templates.js";

const getSmtpConfig = () => {
    const host = process.env.SMTP_HOST?.trim();
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : null;
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();
    const from = process.env.SMTP_FROM?.trim() || user;
    const secure =
        process.env.SMTP_SECURE === "true" || port === 465;

    return { host, port, user, pass, from, secure };
};

const isSmtpConfigured = () => {
    const { host, port, user, pass } = getSmtpConfig();
    return Boolean(host && port && Number.isFinite(port) && user && pass);
};

const createTransporter = () => {
    const { host, port, user, pass, secure } = getSmtpConfig();
    return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
    });
};

const sendEmail = async (
    { to, subject, text, html },
    transporterOverride = null
) => {
    if (!transporterOverride && !isSmtpConfigured()) {
        return {
            sent: false,
            configured: false,
            reason: "SMTP is not configured.",
        };
    }

    if (!to) {
        return {
            sent: false,
            configured: true,
            reason: "Recipient email address is missing.",
        };
    }

    try {
        const { from } = getSmtpConfig();
        const transporter = transporterOverride || createTransporter();
        const info = await transporter.sendMail({
            from: from || "no-reply@campusresolve.local",
            to,
            subject,
            text,
            html,
        });

        return {
            sent: true,
            configured: true,
            messageId: info?.messageId || null,
        };
    } catch (error) {
        return {
            sent: false,
            configured: true,
            error: error?.message || "Email delivery failed.",
        };
    }
};

const sendRegistrationConfirmationEmail = async (
    { to, studentName, eventTitle, venue, startDateTime, ticketCode },
    transporterOverride = null
) => {
    const template = registrationConfirmationTemplate({
        studentName,
        eventTitle,
        venue,
        startDateTime,
        ticketCode,
    });
    return sendEmail({ to, ...template }, transporterOverride);
};

const sendEventApprovedEmail = async (
    { to, organizerName, eventTitle, venue, startDateTime },
    transporterOverride = null
) => {
    const template = eventApprovedTemplate({
        organizerName,
        eventTitle,
        venue,
        startDateTime,
    });
    return sendEmail({ to, ...template }, transporterOverride);
};

const sendEventRejectedEmail = async (
    { to, organizerName, eventTitle, reason },
    transporterOverride = null
) => {
    const template = eventRejectedTemplate({
        organizerName,
        eventTitle,
        reason,
    });
    return sendEmail({ to, ...template }, transporterOverride);
};

const sendEventCancelledEmail = async (
    { to, recipientName, eventTitle, venue, startDateTime },
    transporterOverride = null
) => {
    const template = eventCancelledTemplate({
        recipientName,
        eventTitle,
        venue,
        startDateTime,
    });
    return sendEmail({ to, ...template }, transporterOverride);
};

export {
    isSmtpConfigured,
    sendEmail,
    sendRegistrationConfirmationEmail,
    sendEventApprovedEmail,
    sendEventRejectedEmail,
    sendEventCancelledEmail,
};

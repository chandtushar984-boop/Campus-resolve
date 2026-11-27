import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
    AlertCircle,
    CalendarDays,
    MapPin,
    Ticket,
    XCircle,
} from "lucide-react";
import api from "../services/api";
import Loader from "../components/Loader";
import { Toast } from "../utils/toast";

const formatDateTime = (date) =>
    new Date(date).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

const getRegBadge = (status) =>
    status === "Registered" ? "badge-resolved" : "badge-rejected";

const getAttendanceBadge = (status) => {
    if (status === "Attended") return "badge-resolved";
    if (status === "Absent") return "badge-rejected";
    return "badge-open";
};

const MyTickets = () => {
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [busyId, setBusyId] = useState("");

    const fetchTickets = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await api.get("/registrations/my-tickets");
            setTickets(res.data.tickets || []);
            setError("");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load your tickets.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    const handleCancel = async (registrationId) => {
        setBusyId(registrationId);
        try {
            const res = await api.patch(`/registrations/${registrationId}/cancel`);
            Toast.fire({
                icon: "success",
                title: res.data.message || "Registration cancelled",
            });
            await fetchTickets();
        } catch (err) {
            Toast.fire({
                icon: "error",
                title:
                    err.response?.data?.message ||
                    "Failed to cancel registration.",
            });
        } finally {
            setBusyId("");
        }
    };

    if (isLoading) return <Loader label="Loading your tickets..." />;

    return (
        <div className="page-wrapper space-y-6">
            <div>
                <h1 className="page-title">My Tickets</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Present your QR ticket at the venue for event check-in.
                </p>
            </div>

            {error ? (
                <div className="card p-6 flex items-center gap-3 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                </div>
            ) : tickets.length === 0 ? (
                <div className="card p-12 text-center space-y-3">
                    <Ticket className="w-10 h-10 text-slate-400 mx-auto" />
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                        No event tickets yet
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Register for an approved campus event to receive your QR pass.
                    </p>
                    <div>
                        <Link
                            to="/student/events"
                            className="btn-primary text-xs no-underline inline-flex"
                        >
                            Explore Events
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {tickets.map((ticket) => {
                        const ev = ticket.event;
                        const canCancel =
                            ticket.status === "Registered" &&
                            ticket.attendanceStatus !== "Attended" &&
                            ev?.startDateTime &&
                            new Date() < new Date(ev.startDateTime);

                        return (
                            <article
                                key={ticket._id}
                                className="card p-5 flex flex-col sm:flex-row gap-5 justify-between"
                            >
                                <div className="space-y-3 flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`badge ${getRegBadge(ticket.status)}`}>
                                            {ticket.status}
                                        </span>
                                        {ticket.status === "Registered" && (
                                            <span
                                                className={`badge ${getAttendanceBadge(
                                                    ticket.attendanceStatus
                                                )}`}
                                            >
                                                Attendance: {ticket.attendanceStatus}
                                            </span>
                                        )}
                                    </div>

                                    <div>
                                        <Link
                                            to={ev ? `/events/${ev._id}` : "#"}
                                            className="text-base font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 no-underline"
                                        >
                                            {ev?.title || "Campus Event"}
                                        </Link>
                                        {ev?.club?.name && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                {ev.club.name}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                                        {ev?.startDateTime && (
                                            <p className="flex items-center gap-1.5">
                                                <CalendarDays className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                                <span>{formatDateTime(ev.startDateTime)}</span>
                                            </p>
                                        )}
                                        {ev?.venue && (
                                            <p className="flex items-center gap-1.5">
                                                <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                                <span>{ev.venue}</span>
                                            </p>
                                        )}
                                        <p className="flex items-center gap-1.5">
                                            <Ticket className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                            <span className="font-mono font-semibold text-slate-800 dark:text-slate-100">
                                                {ticket.ticketCode}
                                            </span>
                                        </p>
                                    </div>

                                    {canCancel && (
                                        <div className="pt-1">
                                            <button
                                                type="button"
                                                disabled={busyId === ticket._id}
                                                onClick={() => handleCancel(ticket._id)}
                                                className="btn-danger text-xs disabled:opacity-60"
                                            >
                                                <XCircle className="w-3.5 h-3.5" />
                                                {busyId === ticket._id
                                                    ? "Cancelling..."
                                                    : "Cancel Registration"}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-slate-200 shrink-0 self-center sm:self-stretch">
                                    <QRCodeSVG
                                        value={ticket.ticketCode}
                                        size={112}
                                        level="M"
                                    />
                                    <span className="mt-2 font-mono text-[11px] font-semibold text-slate-700">
                                        {ticket.ticketCode}
                                    </span>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MyTickets;

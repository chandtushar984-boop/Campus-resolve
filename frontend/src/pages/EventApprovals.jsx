import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    AlertCircle,
    CalendarDays,
    CheckCircle2,
    CheckSquare,
    MapPin,
    Search,
    XCircle,
} from "lucide-react";
import api from "../services/api";
import Loader from "../components/Loader";
import { Toast } from "../utils/toast";

const STATUS_TABS = ["Pending", "Approved", "Rejected", "Cancelled", "All"];

const getStatusBadge = (status) => {
    switch (status) {
        case "Approved":
            return "badge-resolved";
        case "Pending":
            return "badge-open";
        case "Rejected":
            return "badge-rejected";
        default:
            return "badge-low";
    }
};

const EventApprovals = () => {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [statusFilter, setStatusFilter] = useState("Pending");
    const [search, setSearch] = useState("");
    const [busyId, setBusyId] = useState("");

    const [rejectingId, setRejectingId] = useState("");
    const [rejectReason, setRejectReason] = useState("");

    const fetchEvents = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = { status: statusFilter };
            if (search.trim()) params.search = search.trim();
            const res = await api.get("/events/manage", { params });
            setEvents(res.data.events || []);
            setError("");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load event proposals.");
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter, search]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handleApprove = async (eventId) => {
        setBusyId(eventId);
        try {
            const res = await api.patch(`/events/${eventId}/approve`);
            Toast.fire({ icon: "success", title: res.data.message || "Event approved" });
            await fetchEvents();
        } catch (err) {
            Toast.fire({
                icon: "error",
                title: err.response?.data?.message || "Could not approve event.",
            });
        } finally {
            setBusyId("");
        }
    };

    const handleRejectSubmit = async (e, eventId) => {
        e.preventDefault();
        if (!rejectReason.trim()) {
            Toast.fire({ icon: "error", title: "Rejection reason is required." });
            return;
        }
        setBusyId(eventId);
        try {
            const res = await api.patch(`/events/${eventId}/reject`, {
                reason: rejectReason.trim(),
            });
            Toast.fire({ icon: "success", title: res.data.message || "Event rejected" });
            setRejectingId("");
            setRejectReason("");
            await fetchEvents();
        } catch (err) {
            Toast.fire({
                icon: "error",
                title: err.response?.data?.message || "Could not reject event.",
            });
        } finally {
            setBusyId("");
        }
    };

    return (
        <div className="page-wrapper space-y-6">
            <div>
                <h1 className="page-title">Event Approvals</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Review club event proposals, check venue availability, and approve or reject requests.
                </p>
            </div>

            {/* Filter Bar */}
            <div className="card p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setStatusFilter(tab)}
                            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                statusFilter === tab
                                    ? "bg-indigo-600 text-white"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="relative w-full lg:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by event title..."
                        className="form-input pl-9"
                        aria-label="Search event proposals"
                    />
                </div>
            </div>

            {isLoading ? (
                <Loader label="Loading event proposals..." />
            ) : error ? (
                <div className="card p-6 flex items-center gap-3 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                </div>
            ) : events.length === 0 ? (
                <div className="card p-12 text-center">
                    <CheckSquare className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                        No {statusFilter === "All" ? "" : statusFilter.toLowerCase()} events found
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Submitted club event proposals will appear here for review.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {events.map((event) => (
                        <article key={event._id} className="card p-5 space-y-4">
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                <div className="min-w-0 space-y-1.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`badge ${getStatusBadge(event.approvalStatus)}`}>
                                            {event.approvalStatus}
                                        </span>
                                        <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                                            {event.category}
                                        </span>
                                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                            {event.club?.name}
                                        </span>
                                    </div>
                                    <h2 className="font-semibold text-base text-slate-900 dark:text-white">
                                        {event.title}
                                    </h2>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                                        {event.description}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                                        <span className="inline-flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5" />
                                            {event.venue}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <CalendarDays className="w-3.5 h-3.5" />
                                            {new Date(event.startDateTime).toLocaleString("en-IN", {
                                                day: "numeric",
                                                month: "short",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}{" "}
                                            –{" "}
                                            {new Date(event.endDateTime).toLocaleString("en-IN", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                        <span>Capacity: {event.seatCapacity}</span>
                                        <span>Organizer: {event.createdBy?.name}</span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 shrink-0">
                                    <Link
                                        to={`/events/${event._id}`}
                                        className="btn-secondary text-xs no-underline"
                                    >
                                        View Details
                                    </Link>
                                    {event.approvalStatus !== "Cancelled" && (
                                        <>
                                            {event.approvalStatus !== "Approved" && (
                                                <button
                                                    type="button"
                                                    disabled={busyId === event._id}
                                                    onClick={() => handleApprove(event._id)}
                                                    className="btn-primary text-xs disabled:opacity-60"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    {busyId === event._id ? "..." : "Approve"}
                                                </button>
                                            )}
                                            {event.approvalStatus !== "Rejected" && (
                                                <button
                                                    type="button"
                                                    disabled={busyId === event._id}
                                                    onClick={() => {
                                                        setRejectingId(
                                                            rejectingId === event._id ? "" : event._id
                                                        );
                                                        setRejectReason("");
                                                    }}
                                                    className="btn-danger text-xs disabled:opacity-60"
                                                >
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    Reject
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {event.approvalStatus === "Rejected" && event.rejectionReason && (
                                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300">
                                    <span className="font-semibold">Rejection Reason: </span>
                                    {event.rejectionReason}
                                </div>
                            )}

                            {rejectingId === event._id && (
                                <form
                                    onSubmit={(e) => handleRejectSubmit(e, event._id)}
                                    className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3"
                                >
                                    <label
                                        htmlFor={`reject-${event._id}`}
                                        className="form-label"
                                    >
                                        Rejection Reason
                                    </label>
                                    <textarea
                                        id={`reject-${event._id}`}
                                        rows={2}
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder="State the reason for rejecting this event proposal..."
                                        className="form-input"
                                        required
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setRejectingId("")}
                                            className="btn-secondary text-xs"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={busyId === event._id}
                                            className="btn-danger text-xs disabled:opacity-60"
                                        >
                                            Confirm Reject
                                        </button>
                                    </div>
                                </form>
                            )}
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EventApprovals;

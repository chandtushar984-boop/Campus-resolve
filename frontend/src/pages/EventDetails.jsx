import { useCallback, useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    AlertCircle,
    ArrowLeft,
    Building2,
    CalendarDays,
    CheckCircle2,
    Clock,
    MapPin,
    Users,
    XCircle,
} from "lucide-react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { getDashboardPath, normalizeRole } from "../config/navigation";
import Loader from "../components/Loader";
import { Toast } from "../utils/toast";
import { resolvePosterUrl } from "../utils/posterUrl";

const formatDateTime = (date) =>
    new Date(date).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

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

const EventDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const role = normalizeRole(user?.role);
    const isFaculty = role === "faculty";

    const [event, setEvent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionBusy, setActionBusy] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [showRejectBox, setShowRejectBox] = useState(false);

    const loadEvent = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await api.get(`/events/${id}`);
            setEvent(res.data.event);
            setError("");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load event details.");
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadEvent();
    }, [loadEvent]);

    const handleApprove = async () => {
        setActionBusy(true);
        try {
            const res = await api.patch(`/events/${id}/approve`);
            Toast.fire({ icon: "success", title: res.data.message || "Event approved" });
            await loadEvent();
        } catch (err) {
            Toast.fire({
                icon: "error",
                title: err.response?.data?.message || "Failed to approve event.",
            });
        } finally {
            setActionBusy(false);
        }
    };

    const handleReject = async (e) => {
        e.preventDefault();
        if (!rejectReason.trim()) {
            Toast.fire({ icon: "error", title: "Please provide a rejection reason." });
            return;
        }
        setActionBusy(true);
        try {
            const res = await api.patch(`/events/${id}/reject`, {
                reason: rejectReason.trim(),
            });
            Toast.fire({ icon: "success", title: res.data.message || "Event rejected" });
            setShowRejectBox(false);
            setRejectReason("");
            await loadEvent();
        } catch (err) {
            Toast.fire({
                icon: "error",
                title: err.response?.data?.message || "Failed to reject event.",
            });
        } finally {
            setActionBusy(false);
        }
    };

    if (isLoading) return <Loader label="Loading event..." />;

    if (error || !event) {
        return (
            <div className="page-wrapper space-y-4">
                <div className="card p-6 flex items-center gap-3 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error || "Event not found."}</span>
                </div>
                <Link to={getDashboardPath(user?.role)} className="btn-secondary no-underline">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    const poster = resolvePosterUrl(event.posterImage);

    return (
        <div className="page-wrapper space-y-6">
            <div>
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="btn-secondary text-xs"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>
            </div>

            <article className="card overflow-hidden">
                {poster && (
                    <img
                        src={poster}
                        alt={event.title}
                        className="w-full max-h-80 object-cover border-b border-slate-200 dark:border-slate-800"
                    />
                )}

                <div className="p-6 sm:p-8 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`badge ${getStatusBadge(event.approvalStatus)}`}>
                                    {event.approvalStatus}
                                </span>
                                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                                    {event.category}
                                </span>
                            </div>
                            <h1 className="page-title">{event.title}</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <Building2 className="w-4 h-4" />
                                Organized by{" "}
                                <span className="font-medium text-slate-700 dark:text-slate-200">
                                    {event.club?.name}
                                </span>
                            </p>
                        </div>

                        {isFaculty && event.approvalStatus !== "Cancelled" && (
                            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                                {event.approvalStatus !== "Approved" && (
                                    <button
                                        type="button"
                                        disabled={actionBusy}
                                        onClick={handleApprove}
                                        className="btn-primary text-xs disabled:opacity-60"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        Approve
                                    </button>
                                )}
                                {event.approvalStatus !== "Rejected" && (
                                    <button
                                        type="button"
                                        disabled={actionBusy}
                                        onClick={() => setShowRejectBox((prev) => !prev)}
                                        className="btn-danger text-xs disabled:opacity-60"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Reject
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {event.approvalStatus === "Rejected" && event.rejectionReason && (
                        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-sm text-red-700 dark:text-red-300">
                            <p className="font-semibold mb-0.5">Rejection Reason</p>
                            <p>{event.rejectionReason}</p>
                        </div>
                    )}

                    {isFaculty && showRejectBox && (
                        <form
                            onSubmit={handleReject}
                            className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3"
                        >
                            <label htmlFor="detail-reject-reason" className="form-label">
                                Rejection Reason
                            </label>
                            <textarea
                                id="detail-reject-reason"
                                rows={2}
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Explain why this event proposal is being rejected..."
                                className="form-input"
                                required
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowRejectBox(false)}
                                    className="btn-secondary text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionBusy}
                                    className="btn-danger text-xs disabled:opacity-60"
                                >
                                    Confirm Reject
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5" />
                                Venue
                            </p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                                {event.venue}
                            </p>
                        </div>
                        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <CalendarDays className="w-3.5 h-3.5" />
                                Starts
                            </p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                                {formatDateTime(event.startDateTime)}
                            </p>
                        </div>
                        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                Ends
                            </p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                                {formatDateTime(event.endDateTime)}
                            </p>
                        </div>
                        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5" />
                                Seat Capacity
                            </p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                                {event.seatCapacity} seats
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            About This Event
                        </h2>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                            {event.description}
                        </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>
                            Registration Deadline: {formatDateTime(event.registrationDeadline)}
                        </span>
                        <span>Created by {event.createdBy?.name || "Club Organizer"}</span>
                    </div>
                </div>
            </article>
        </div>
    );
};

export default EventDetails;

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
    Star,
    Ticket,
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
    const isStudent = role === "student";

    const [event, setEvent] = useState(null);
    const [myRegistration, setMyRegistration] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [ratingSummary, setRatingSummary] = useState({ averageRating: null, reviewCount: 0 });
    const [reviewEligibility, setReviewEligibility] = useState(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);
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
            if (isStudent) {
                try {
                    const regRes = await api.get(`/events/${id}/my-registration`);
                    setMyRegistration(regRes.data.registration || null);
                } catch {
                    setMyRegistration(null);
                }
            }
            if (res.data.event?.approvalStatus === "Approved") {
                try {
                    const revRes = await api.get(`/events/${id}/reviews`);
                    setReviews(revRes.data.reviews || []);
                    setRatingSummary(
                        revRes.data.ratingSummary || { averageRating: null, reviewCount: 0 }
                    );
                    setReviewEligibility(revRes.data.eligibility || null);
                } catch {
                    setReviews([]);
                }
            }
            setError("");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load event details.");
        } finally {
            setIsLoading(false);
        }
    }, [id, isStudent]);

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

    const handleRegister = async () => {
        setActionBusy(true);
        try {
            const res = await api.post(`/events/${id}/register`);
            Toast.fire({
                icon: "success",
                title: res.data.message || "Registered successfully!",
            });
            await loadEvent();
        } catch (err) {
            Toast.fire({
                icon: "error",
                title: err.response?.data?.message || "Registration failed.",
            });
        } finally {
            setActionBusy(false);
        }
    };

    const handleCancelRegistration = async () => {
        if (!myRegistration?._id) return;
        setActionBusy(true);
        try {
            const res = await api.patch(`/registrations/${myRegistration._id}/cancel`);
            Toast.fire({
                icon: "success",
                title: res.data.message || "Registration cancelled",
            });
            await loadEvent();
        } catch (err) {
            Toast.fire({
                icon: "error",
                title: err.response?.data?.message || "Failed to cancel registration.",
            });
        } finally {
            setActionBusy(false);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!reviewComment.trim()) {
            Toast.fire({ icon: "error", title: "Please write a short review." });
            return;
        }
        setSubmittingReview(true);
        try {
            const res = await api.post(`/events/${id}/reviews`, {
                rating: reviewRating,
                comment: reviewComment.trim(),
            });
            Toast.fire({
                icon: "success",
                title: res.data.message || "Review submitted!",
            });
            setReviewComment("");
            await loadEvent();
        } catch (err) {
            Toast.fire({
                icon: "error",
                title: err.response?.data?.message || "Failed to submit review.",
            });
        } finally {
            setSubmittingReview(false);
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
                                {event.approvalStatus === "Approved" && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                                        {ratingSummary.reviewCount > 0
                                            ? `${ratingSummary.averageRating} (${ratingSummary.reviewCount} ${ratingSummary.reviewCount === 1 ? "review" : "reviews"})`
                                            : "No reviews yet"}
                                    </span>
                                )}
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

                        {isStudent && event.approvalStatus === "Approved" && (() => {
                            const now = new Date();
                            const isFull = (event.registeredCount || 0) >= event.seatCapacity;
                            const isEnded = now > new Date(event.endDateTime);
                            const isDeadlinePassed = now > new Date(event.registrationDeadline);
                            const canCancel =
                                myRegistration &&
                                myRegistration.attendanceStatus !== "Attended" &&
                                now < new Date(event.startDateTime);

                            if (myRegistration) {
                                return (
                                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                                        <Link
                                            to="/student/my-tickets"
                                            className="btn-primary text-xs no-underline"
                                        >
                                            <Ticket className="w-4 h-4" />
                                            View Ticket ({myRegistration.ticketCode})
                                        </Link>
                                        {canCancel && (
                                            <button
                                                type="button"
                                                disabled={actionBusy}
                                                onClick={handleCancelRegistration}
                                                className="btn-danger text-xs disabled:opacity-60"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Cancel Registration
                                            </button>
                                        )}
                                    </div>
                                );
                            }

                            if (isEnded) {
                                return (
                                    <span className="badge badge-low shrink-0">
                                        Event Ended
                                    </span>
                                );
                            }
                            if (isDeadlinePassed) {
                                return (
                                    <span className="badge badge-rejected shrink-0">
                                        Registration Closed
                                    </span>
                                );
                            }
                            if (isFull) {
                                return (
                                    <span className="badge badge-rejected shrink-0">
                                        Seats Full
                                    </span>
                                );
                            }

                            return (
                                <button
                                    type="button"
                                    disabled={actionBusy}
                                    onClick={handleRegister}
                                    className="btn-primary text-xs shrink-0 disabled:opacity-60"
                                >
                                    <Ticket className="w-4 h-4" />
                                    {actionBusy ? "Registering..." : "Register for Event"}
                                </button>
                            );
                        })()}

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
                                {event.registeredCount || 0} / {event.seatCapacity} Seats Filled
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

            {event.approvalStatus === "Approved" && (
                <section className="card p-6 sm:p-8 space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                                Event Reviews &amp; Ratings
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {ratingSummary.reviewCount > 0
                                    ? `Average Rating: ${ratingSummary.averageRating} / 5 across ${ratingSummary.reviewCount} ${ratingSummary.reviewCount === 1 ? "review" : "reviews"}`
                                    : "No reviews have been submitted for this event yet."}
                            </p>
                        </div>
                    </div>

                    {isStudent && reviewEligibility?.canReview && (
                        <form
                            onSubmit={handleSubmitReview}
                            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <label className="form-label mb-0">
                                    Rate this event
                                </label>
                                <div className="flex items-center gap-1" role="radiogroup" aria-label="Event rating">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setReviewRating(star)}
                                            className="p-1 cursor-pointer"
                                            aria-label={`${star} star${star > 1 ? "s" : ""}`}
                                        >
                                            <Star
                                                className={`w-5 h-5 ${
                                                    star <= reviewRating
                                                        ? "fill-amber-400 text-amber-500"
                                                        : "text-slate-300 dark:text-slate-600"
                                                }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <textarea
                                rows={3}
                                maxLength={1000}
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                placeholder="Share your feedback about this event..."
                                className="form-input"
                                required
                            />
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={submittingReview}
                                    className="btn-primary text-xs disabled:opacity-60"
                                >
                                    {submittingReview ? "Submitting..." : "Submit Review"}
                                </button>
                            </div>
                        </form>
                    )}

                    {isStudent && reviewEligibility && !reviewEligibility.canReview && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 px-3.5 py-2.5 rounded-lg border border-slate-200/70 dark:border-slate-700/60">
                            {reviewEligibility.reason}
                        </p>
                    )}

                    {reviews.length > 0 && (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {reviews.map((rev) => (
                                <div key={rev._id} className="py-3.5 first:pt-0 last:pb-0 space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                                            {rev.student?.name || "Student"}
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                                            {rev.rating} / 5
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                        {rev.comment}
                                    </p>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                        {formatDateTime(rev.createdAt)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}
        </div>
    );
};

export default EventDetails;

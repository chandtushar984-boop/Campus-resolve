import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    AlertCircle,
    CalendarRange,
    Edit3,
    MapPin,
    Plus,
    Upload,
    X,
    XCircle,
} from "lucide-react";
import api from "../services/api";
import Loader from "../components/Loader";
import { Toast } from "../utils/toast";
import { resolvePosterUrl } from "../utils/posterUrl";

const EVENT_CATEGORIES = [
    "Technical",
    "Cultural",
    "Sports",
    "Workshop",
    "Seminar",
    "Competition",
    "Social",
    "Other",
];

const emptyForm = {
    title: "",
    description: "",
    category: "Technical",
    venue: "",
    startDateTime: "",
    endDateTime: "",
    registrationDeadline: "",
    seatCapacity: "50",
    posterImage: "",
};

const toDatetimeLocal = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
        d.getHours()
    )}:${pad(d.getMinutes())}`;
};

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

const ManageEvents = () => {
    const [club, setClub] = useState(null);
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState("");
    const [form, setForm] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingPoster, setUploadingPoster] = useState(false);

    const fetchEvents = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await api.get("/events/my-club");
            setClub(res.data.club || null);
            setEvents(res.data.events || []);
            setError("");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load club events.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handlePosterFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            Toast.fire({ icon: "error", title: "Poster must be 2 MB or smaller." });
            return;
        }

        setUploadingPoster(true);
        try {
            const dataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            const res = await api.post("/events/upload-poster", { dataUrl });
            setForm((prev) => ({ ...prev, posterImage: res.data.posterUrl }));
            Toast.fire({ icon: "success", title: "Poster uploaded" });
        } catch (err) {
            Toast.fire({
                icon: "error",
                title: err.response?.data?.message || "Failed to upload poster.",
            });
        } finally {
            setUploadingPoster(false);
        }
    };

    const startCreate = () => {
        setEditingId("");
        setForm(emptyForm);
        setShowForm(true);
    };

    const startEdit = (event) => {
        setEditingId(event._id);
        setForm({
            title: event.title || "",
            description: event.description || "",
            category: event.category || "Technical",
            venue: event.venue || "",
            startDateTime: toDatetimeLocal(event.startDateTime),
            endDateTime: toDatetimeLocal(event.endDateTime),
            registrationDeadline: toDatetimeLocal(event.registrationDeadline),
            seatCapacity: String(event.seatCapacity || 50),
            posterImage: event.posterImage || "",
        });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                ...form,
                seatCapacity: Number(form.seatCapacity),
            };
            if (editingId) {
                const res = await api.put(`/events/${editingId}`, payload);
                Toast.fire({ icon: "success", title: res.data.message || "Event updated" });
            } else {
                const res = await api.post("/events", payload);
                Toast.fire({ icon: "success", title: res.data.message || "Event created" });
            }
            setShowForm(false);
            setEditingId("");
            setForm(emptyForm);
            await fetchEvents();
        } catch (err) {
            Toast.fire({
                icon: "error",
                title: err.response?.data?.message || "Failed to save event.",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelEvent = async (eventId) => {
        try {
            const res = await api.patch(`/events/${eventId}/cancel`);
            Toast.fire({ icon: "success", title: res.data.message || "Event cancelled" });
            await fetchEvents();
        } catch (err) {
            Toast.fire({
                icon: "error",
                title: err.response?.data?.message || "Failed to cancel event.",
            });
        }
    };

    if (isLoading) return <Loader label="Loading club events..." />;

    if (error && !club) {
        return (
            <div className="page-wrapper space-y-4">
                <div className="card p-6 flex items-center gap-3 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="page-wrapper space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="page-title">Manage Events</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {club ? `Organizing events for ${club.name}` : "Create and manage your club events."}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => (showForm ? setShowForm(false) : startCreate())}
                    className="btn-primary self-start sm:self-auto"
                >
                    {showForm ? (
                        <>
                            <X className="w-4 h-4" />
                            Close Form
                        </>
                    ) : (
                        <>
                            <Plus className="w-4 h-4" />
                            Create Event
                        </>
                    )}
                </button>
            </div>

            {showForm && (
                <section className="card p-6">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
                        {editingId ? "Edit Event Proposal" : "Create Event Proposal"}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="ev-title" className="form-label">
                                    Event Title
                                </label>
                                <input
                                    id="ev-title"
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    placeholder="e.g., Applied AI Workshop"
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="ev-cat" className="form-label">
                                    Category
                                </label>
                                <select
                                    id="ev-cat"
                                    value={form.category}
                                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                                    className="form-input"
                                >
                                    {EVENT_CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="ev-venue" className="form-label">
                                    Venue
                                </label>
                                <input
                                    id="ev-venue"
                                    type="text"
                                    value={form.venue}
                                    onChange={(e) => setForm({ ...form, venue: e.target.value })}
                                    placeholder="e.g., Main Auditorium"
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="ev-cap" className="form-label">
                                    Seat Capacity
                                </label>
                                <input
                                    id="ev-cap"
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={form.seatCapacity}
                                    onChange={(e) =>
                                        setForm({ ...form, seatCapacity: e.target.value })
                                    }
                                    className="form-input"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="ev-start" className="form-label">
                                    Start Date &amp; Time
                                </label>
                                <input
                                    id="ev-start"
                                    type="datetime-local"
                                    value={form.startDateTime}
                                    onChange={(e) =>
                                        setForm({ ...form, startDateTime: e.target.value })
                                    }
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="ev-end" className="form-label">
                                    End Date &amp; Time
                                </label>
                                <input
                                    id="ev-end"
                                    type="datetime-local"
                                    value={form.endDateTime}
                                    onChange={(e) =>
                                        setForm({ ...form, endDateTime: e.target.value })
                                    }
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="ev-deadline" className="form-label">
                                    Registration Deadline
                                </label>
                                <input
                                    id="ev-deadline"
                                    type="datetime-local"
                                    value={form.registrationDeadline}
                                    onChange={(e) =>
                                        setForm({ ...form, registrationDeadline: e.target.value })
                                    }
                                    className="form-input"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                            <div>
                                <label htmlFor="ev-poster-file" className="form-label">
                                    Upload Poster Image (JPEG, PNG, WEBP, GIF · max 2MB)
                                </label>
                                <label
                                    htmlFor="ev-poster-file"
                                    className="btn-secondary w-full cursor-pointer"
                                >
                                    <Upload className="w-4 h-4" />
                                    {uploadingPoster ? "Uploading..." : "Choose Poster Image"}
                                    <input
                                        id="ev-poster-file"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        onChange={handlePosterFile}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                            <div>
                                <label htmlFor="ev-poster-url" className="form-label">
                                    Or Poster Image URL
                                </label>
                                <input
                                    id="ev-poster-url"
                                    type="text"
                                    value={form.posterImage}
                                    onChange={(e) =>
                                        setForm({ ...form, posterImage: e.target.value })
                                    }
                                    placeholder="/uploads/posters/... or https://..."
                                    className="form-input"
                                />
                            </div>
                        </div>

                        {form.posterImage && (
                            <div className="flex items-center gap-3">
                                <img
                                    src={resolvePosterUrl(form.posterImage)}
                                    alt="Poster preview"
                                    className="w-24 h-16 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                                />
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, posterImage: "" })}
                                    className="text-xs text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                                >
                                    Remove poster
                                </button>
                            </div>
                        )}

                        <div>
                            <label htmlFor="ev-desc" className="form-label">
                                Description
                            </label>
                            <textarea
                                id="ev-desc"
                                rows={3}
                                value={form.description}
                                onChange={(e) =>
                                    setForm({ ...form, description: e.target.value })
                                }
                                placeholder="Describe event agenda, speakers, and details..."
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || uploadingPoster}
                                className="btn-primary disabled:opacity-60"
                            >
                                {submitting
                                    ? "Submitting..."
                                    : editingId
                                      ? "Save Changes"
                                      : "Submit for Approval"}
                            </button>
                        </div>
                    </form>
                </section>
            )}

            {events.length === 0 ? (
                <div className="card p-12 text-center">
                    <CalendarRange className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                        No events created yet
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Create your first club event proposal to submit it for faculty approval.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {events.map((event) => (
                        <article key={event._id} className="card p-5 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div className="min-w-0 space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`badge ${getStatusBadge(event.approvalStatus)}`}>
                                            {event.approvalStatus}
                                        </span>
                                        <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                            {event.category}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-base text-slate-900 dark:text-white">
                                        {event.title}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-3">
                                        <span className="inline-flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5" />
                                            {event.venue}
                                        </span>
                                        <span>
                                            {new Date(event.startDateTime).toLocaleString("en-IN", {
                                                day: "numeric",
                                                month: "short",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                        <span>{event.seatCapacity} seats</span>
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 shrink-0">
                                    <Link
                                        to={`/events/${event._id}`}
                                        className="btn-secondary text-xs no-underline"
                                    >
                                        Details
                                    </Link>
                                    {event.approvalStatus !== "Cancelled" && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => startEdit(event)}
                                                className="btn-secondary text-xs"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleCancelEvent(event._id)}
                                                className="btn-danger text-xs"
                                            >
                                                <XCircle className="w-3.5 h-3.5" />
                                                Cancel
                                            </button>
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
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ManageEvents;

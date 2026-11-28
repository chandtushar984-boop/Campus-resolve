import { useCallback, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Megaphone, Pin, Plus, Trash2 } from "lucide-react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import Loader from "../components/Loader";
import { Toast } from "../utils/toast";

const ClubAnnouncements = () => {
    const { user } = useContext(AuthContext);
    const clubId = user?.managedClub?._id || user?.managedClub || "";

    const [announcements, setAnnouncements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [posting, setPosting] = useState(false);
    const [form, setForm] = useState({ title: "", content: "", isPinned: false });

    const fetchAnnouncements = useCallback(async () => {
        if (!clubId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const res = await api.get(`/clubs/${clubId}/announcements`);
            setAnnouncements(res.data.announcements || []);
            setError("");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load announcements.");
        } finally {
            setIsLoading(false);
        }
    }, [clubId]);

    useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.content.trim()) {
            Toast.fire({ icon: "error", title: "Title and content are required." });
            return;
        }
        setPosting(true);
        try {
            const res = await api.post(`/clubs/${clubId}/announcements`, form);
            Toast.fire({ icon: "success", title: res.data.message || "Announcement posted" });
            setForm({ title: "", content: "", isPinned: false });
            await fetchAnnouncements();
        } catch (err) {
            Toast.fire({
                icon: "error",
                title: err.response?.data?.message || "Failed to post announcement.",
            });
        } finally {
            setPosting(false);
        }
    };

    const handleTogglePin = async (ann) => {
        try {
            await api.put(`/clubs/${clubId}/announcements/${ann._id}`, {
                isPinned: !ann.isPinned,
            });
            await fetchAnnouncements();
        } catch (err) {
            Toast.fire({
                icon: "error",
                title: err.response?.data?.message || "Failed to update announcement.",
            });
        }
    };

    const handleDelete = async (annId) => {
        try {
            const res = await api.delete(`/clubs/${clubId}/announcements/${annId}`);
            Toast.fire({ icon: "success", title: res.data.message || "Deleted" });
            setAnnouncements((prev) => prev.filter((a) => a._id !== annId));
        } catch (err) {
            Toast.fire({
                icon: "error",
                title: err.response?.data?.message || "Failed to delete announcement.",
            });
        }
    };

    if (isLoading) return <Loader label="Loading announcements..." />;

    if (!clubId) {
        return (
            <div className="page-wrapper">
                <div className="card p-10 text-center">
                    <Megaphone className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                        No Club Assigned
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        You need to be assigned to a club by Faculty before posting announcements.
                    </p>
                    <Link to="/club-head/dashboard" className="btn-secondary mt-5 no-underline">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="page-wrapper space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="page-title">Club Announcements</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Post updates and pin important notices for your club members.
                    </p>
                </div>
                <Link to="/club-head/my-club" className="btn-secondary text-xs no-underline self-start sm:self-auto">
                    View My Club
                </Link>
            </div>

            {/* Create Announcement */}
            <section className="card p-6">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    New Announcement
                </h2>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label htmlFor="ch-ann-title" className="form-label">
                            Title
                        </label>
                        <input
                            id="ch-ann-title"
                            type="text"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            placeholder="e.g., Weekly Workshop Schedule"
                            className="form-input"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="ch-ann-content" className="form-label">
                            Message
                        </label>
                        <textarea
                            id="ch-ann-content"
                            rows={3}
                            value={form.content}
                            onChange={(e) => setForm({ ...form, content: e.target.value })}
                            placeholder="Write your announcement for club members..."
                            className="form-input"
                            required
                        />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.isPinned}
                                onChange={(e) =>
                                    setForm({ ...form, isPinned: e.target.checked })
                                }
                            />
                            Pin to top
                        </label>
                        <button
                            type="submit"
                            disabled={posting}
                            className="btn-primary disabled:opacity-60"
                        >
                            {posting ? "Posting..." : "Post Announcement"}
                        </button>
                    </div>
                </form>
            </section>

            {/* Announcements List */}
            {error ? (
                <div className="card p-6 flex items-center gap-3 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                </div>
            ) : announcements.length === 0 ? (
                <div className="card p-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    No announcements posted yet.
                </div>
            ) : (
                <div className="space-y-3">
                    {announcements.map((ann) => (
                        <article key={ann._id} className="card p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {ann.isPinned && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300">
                                                <Pin className="w-3 h-3" />
                                                Pinned
                                            </span>
                                        )}
                                        <h3 className="font-semibold text-base text-slate-900 dark:text-white">
                                            {ann.title}
                                        </h3>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 whitespace-pre-line">
                                        {ann.content}
                                    </p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                                        {new Date(ann.createdAt).toLocaleDateString("en-IN", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => handleTogglePin(ann)}
                                        aria-label={ann.isPinned ? "Unpin announcement" : "Pin announcement"}
                                        className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                    >
                                        <Pin className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(ann._id)}
                                        aria-label="Delete announcement"
                                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ClubAnnouncements;

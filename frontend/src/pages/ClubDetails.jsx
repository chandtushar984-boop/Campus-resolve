import { useCallback, useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    AlertCircle,
    ArrowLeft,
    Building2,
    Edit3,
    Megaphone,
    Pin,
    Plus,
    Trash2,
    UserCheck,
    Users,
} from "lucide-react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { getDashboardPath, normalizeRole } from "../config/navigation";
import Loader from "../components/Loader";
import { Toast } from "../utils/toast";

const CLUB_CATEGORIES = [
    "Technical",
    "Cultural",
    "Sports",
    "Literary",
    "Social",
    "Academic",
    "Other",
];

const ClubDetails = () => {
    const { id: routeClubId } = useParams();
    const { user, refreshUser } = useContext(AuthContext);
    const role = normalizeRole(user?.role);
    const isFaculty = role === "faculty";
    const isStudent = role === "student";

    const managedClubId = user?.managedClub?._id || user?.managedClub || "";
    const clubId = routeClubId || managedClubId;

    const [club, setClub] = useState(null);
    const [members, setMembers] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [announcementsRestricted, setAnnouncementsRestricted] = useState(false);
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    // Edit club state
    const [isEditing, setIsEditing] = useState(false);
    const [savingEdit, setSavingEdit] = useState(false);
    const [editForm, setEditForm] = useState({
        name: "",
        category: "Technical",
        description: "",
        logo: "",
    });

    // Assign head & co-head state (Faculty only)
    const [selectedHeadId, setSelectedHeadId] = useState("");
    const [assigningHead, setAssigningHead] = useState(false);
    const [selectedCoHeadId, setSelectedCoHeadId] = useState("");
    const [assigningCoHead, setAssigningCoHead] = useState(false);

    // Join/leave state
    const [membershipBusy, setMembershipBusy] = useState(false);

    // New announcement state
    const [showAnnForm, setShowAnnForm] = useState(false);
    const [annForm, setAnnForm] = useState({
        title: "",
        content: "",
        isPinned: false,
    });
    const [postingAnn, setPostingAnn] = useState(false);

    const canManageThisClub =
        isFaculty ||
        ((role === "club_head" || role === "co_head") &&
            ((club?.clubHead?._id && club.clubHead._id === user?._id) ||
                (club?.coHead?._id && club.coHead._id === user?._id)));

    const loadClubData = useCallback(async () => {
        if (!clubId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const [clubRes, membersRes] = await Promise.all([
                api.get(`/clubs/${clubId}`),
                api.get(`/clubs/${clubId}/members`),
            ]);

            const loadedClub = clubRes.data.club;
            setClub(loadedClub);
            setMembers(membersRes.data.members || []);
            setEditForm({
                name: loadedClub.name || "",
                category: loadedClub.category || "Technical",
                description: loadedClub.description || "",
                logo: loadedClub.logo || "",
            });
            setSelectedHeadId(loadedClub.clubHead?._id || "");
            setSelectedCoHeadId(loadedClub.coHead?._id || "");
            setError("");

            try {
                const annRes = await api.get(`/clubs/${clubId}/announcements`);
                setAnnouncements(annRes.data.announcements || []);
                setAnnouncementsRestricted(false);
            } catch (annErr) {
                if (annErr.response?.status === 403) {
                    setAnnouncements([]);
                    setAnnouncementsRestricted(true);
                }
            }

            if (isFaculty) {
                const studRes = await api.get("/auth/students");
                setStudents(studRes.data.students || []);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load club details.");
        } finally {
            setIsLoading(false);
        }
    }, [clubId, isFaculty]);

    useEffect(() => {
        loadClubData();
    }, [loadClubData]);

    const handleJoinLeave = async () => {
        if (!club) return;
        setMembershipBusy(true);
        try {
            if (club.isMember) {
                const res = await api.delete(`/clubs/${club._id}/leave`);
                Toast.fire({ icon: "success", title: res.data.message });
            } else {
                const res = await api.post(`/clubs/${club._id}/join`);
                Toast.fire({ icon: "success", title: res.data.message });
            }
            await loadClubData();
        } catch (err) {
            Toast.fire({
                icon: "error",
                title: err.response?.data?.message || "Membership update failed.",
            });
        } finally {
            setMembershipBusy(false);
        }
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        setSavingEdit(true);
        try {
            const res = await api.put(`/clubs/${club._id}`, editForm);
            Toast.fire({ icon: "success", title: res.data.message || "Club updated" });
            setIsEditing(false);
            await loadClubData();
            if (role === "club_head") {
                await refreshUser().catch(() => {});
            }
        } catch (err) {
            Toast.fire({
                icon: "error",
                title: err.response?.data?.message || "Failed to update club.",
            });
        } finally {
            setSavingEdit(false);
        }
    };

    const handleAssignHead = async (e) => {
        e.preventDefault();
        setAssigningHead(true);
        try {
            const res = await api.patch(`/clubs/${club._id}/assign-head`, {
                userId: selectedHeadId || null,
            });
            Toast.fire({ icon: "success", title: res.data.message });
            await loadClubData();
        } catch (err) {
            Toast.fire({
                icon: "error",
                title: err.response?.data?.message || "Failed to assign Club Head.",
            });
        } finally {
            setAssigningHead(false);
        }
    };

    const handleAssignCoHead = async (e) => {
        e.preventDefault();
        setAssigningCoHead(true);
        try {
            const res = await api.patch(`/clubs/${club._id}/assign-co-head`, {
                userId: selectedCoHeadId || null,
            });
            Toast.fire({ icon: "success", title: res.data.message });
            await loadClubData();
        } catch (err) {
            Toast.fire({
                icon: "error",
                title: err.response?.data?.message || "Failed to assign Co-Head.",
            });
        } finally {
            setAssigningCoHead(false);
        }
    };

    const handleCreateAnnouncement = async (e) => {
        e.preventDefault();
        if (!annForm.title.trim() || !annForm.content.trim()) {
            Toast.fire({ icon: "error", title: "Title and content are required." });
            return;
        }
        setPostingAnn(true);
        try {
            const res = await api.post(`/clubs/${club._id}/announcements`, annForm);
            Toast.fire({ icon: "success", title: res.data.message || "Announcement posted" });
            setAnnForm({ title: "", content: "", isPinned: false });
            setShowAnnForm(false);
            await loadClubData();
        } catch (err) {
            Toast.fire({
                icon: "error",
                title: err.response?.data?.message || "Failed to post announcement.",
            });
        } finally {
            setPostingAnn(false);
        }
    };

    const handleTogglePin = async (ann) => {
        try {
            await api.put(`/clubs/${club._id}/announcements/${ann._id}`, {
                isPinned: !ann.isPinned,
            });
            await loadClubData();
        } catch (err) {
            Toast.fire({
                icon: "error",
                title: err.response?.data?.message || "Failed to update announcement.",
            });
        }
    };

    const handleDeleteAnnouncement = async (annId) => {
        try {
            const res = await api.delete(`/clubs/${club._id}/announcements/${annId}`);
            Toast.fire({ icon: "success", title: res.data.message || "Deleted" });
            setAnnouncements((prev) => prev.filter((a) => a._id !== annId));
        } catch (err) {
            Toast.fire({
                icon: "error",
                title: err.response?.data?.message || "Failed to delete announcement.",
            });
        }
    };

    if (isLoading) return <Loader label="Loading club details..." />;

    if (!clubId) {
        return (
            <div className="page-wrapper">
                <div className="card p-10 text-center">
                    <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                        No Club Assigned
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                        You have not been assigned to a club yet. Ask a Faculty coordinator to assign you to a club.
                    </p>
                    <Link
                        to={getDashboardPath(user?.role)}
                        className="btn-secondary mt-5 no-underline"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    if (error || !club) {
        return (
            <div className="page-wrapper space-y-4">
                <div className="card p-6 flex items-center gap-3 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error || "Club not found."}</span>
                </div>
                <Link to={getDashboardPath(user?.role)} className="btn-secondary no-underline">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    const backPath =
        role === "faculty"
            ? "/faculty/clubs"
            : role === "club_head"
              ? "/club-head/dashboard"
              : "/student/clubs";

    return (
        <div className="page-wrapper space-y-6">
            <div className="flex items-center justify-between gap-3">
                <Link to={backPath} className="btn-secondary text-xs no-underline">
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Link>
            </div>

            {/* Club Profile Header */}
            <section className="card p-6 sm:p-8">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                    <div className="flex items-start gap-4 min-w-0">
                        {club.logo ? (
                            <img
                                src={club.logo}
                                alt={club.name}
                                className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-2xl shrink-0">
                                {club.name?.charAt(0)?.toUpperCase()}
                            </div>
                        )}
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                <h1 className="page-title">{club.name}</h1>
                                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                                    {club.category}
                                </span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                                {club.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
                                <span className="inline-flex items-center gap-1.5 font-medium">
                                    <Users className="w-4 h-4" />
                                    {club.memberCount} {club.memberCount === 1 ? "member" : "members"}
                                </span>
                                <span className="inline-flex items-center gap-1.5 font-medium">
                                    <UserCheck className="w-4 h-4" />
                                    Club Head: {club.clubHead?.name || "Unassigned"}
                                </span>
                                <span className="inline-flex items-center gap-1.5 font-medium">
                                    <UserCheck className="w-4 h-4" />
                                    Co-Head: {club.coHead?.name || "Unassigned"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        {isStudent && (
                            <button
                                type="button"
                                disabled={membershipBusy}
                                onClick={handleJoinLeave}
                                className={
                                    club.isMember
                                        ? "btn-danger disabled:opacity-60"
                                        : "btn-primary disabled:opacity-60"
                                }
                            >
                                {membershipBusy
                                    ? "Updating..."
                                    : club.isMember
                                      ? "Leave Club"
                                      : "Join Club"}
                            </button>
                        )}
                        {canManageThisClub && (
                            <button
                                type="button"
                                onClick={() => setIsEditing((prev) => !prev)}
                                className="btn-secondary"
                            >
                                <Edit3 className="w-4 h-4" />
                                {isEditing ? "Cancel Edit" : "Edit Profile"}
                            </button>
                        )}
                    </div>
                </div>

                {/* Edit Club Form */}
                {canManageThisClub && isEditing && (
                    <form
                        onSubmit={handleSaveEdit}
                        className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4"
                    >
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                            Edit Club Profile
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="edit-name" className="form-label">
                                    Club Name
                                </label>
                                <input
                                    id="edit-name"
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) =>
                                        setEditForm({ ...editForm, name: e.target.value })
                                    }
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="edit-category" className="form-label">
                                    Category
                                </label>
                                <select
                                    id="edit-category"
                                    value={editForm.category}
                                    onChange={(e) =>
                                        setEditForm({ ...editForm, category: e.target.value })
                                    }
                                    className="form-input"
                                >
                                    {CLUB_CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="edit-logo" className="form-label">
                                Logo URL
                            </label>
                            <input
                                id="edit-logo"
                                type="url"
                                value={editForm.logo}
                                onChange={(e) =>
                                    setEditForm({ ...editForm, logo: e.target.value })
                                }
                                placeholder="https://example.com/logo.png"
                                className="form-input"
                            />
                        </div>

                        <div>
                            <label htmlFor="edit-desc" className="form-label">
                                Description
                            </label>
                            <textarea
                                id="edit-desc"
                                rows={3}
                                value={editForm.description}
                                onChange={(e) =>
                                    setEditForm({ ...editForm, description: e.target.value })
                                }
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={savingEdit}
                                className="btn-primary disabled:opacity-60"
                            >
                                {savingEdit ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                )}

                {/* Faculty: Assign Club Head & Co-Head */}
                {isFaculty && (
                    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <form
                            onSubmit={handleAssignHead}
                            className="flex flex-col sm:flex-row sm:items-end gap-3"
                        >
                            <div className="flex-1">
                                <label htmlFor="assign-head-select" className="form-label">
                                    Club Head Assignment
                                </label>
                                <select
                                    id="assign-head-select"
                                    value={selectedHeadId}
                                    onChange={(e) => setSelectedHeadId(e.target.value)}
                                    className="form-input"
                                >
                                    <option value="">Unassigned (Remove Head)</option>
                                    {students.map((s) => (
                                        <option key={s._id} value={s._id}>
                                            {s.name} ({s.rollNo || s.email})
                                            {s.managedClub && s.managedClub !== club._id
                                                ? " — Managing another club"
                                                : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={assigningHead}
                                className="btn-primary shrink-0 disabled:opacity-60"
                            >
                                <UserCheck className="w-4 h-4" />
                                {assigningHead ? "Saving..." : "Save Head"}
                            </button>
                        </form>

                        <form
                            onSubmit={handleAssignCoHead}
                            className="flex flex-col sm:flex-row sm:items-end gap-3"
                        >
                            <div className="flex-1">
                                <label htmlFor="assign-cohead-select" className="form-label">
                                    Co-Head Assignment
                                </label>
                                <select
                                    id="assign-cohead-select"
                                    value={selectedCoHeadId}
                                    onChange={(e) => setSelectedCoHeadId(e.target.value)}
                                    className="form-input"
                                >
                                    <option value="">Unassigned (Remove Co-Head)</option>
                                    {students.map((s) => (
                                        <option key={s._id} value={s._id}>
                                            {s.name} ({s.rollNo || s.email})
                                            {s.managedClub && s.managedClub !== club._id
                                                ? " — Managing another club"
                                                : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={assigningCoHead}
                                className="btn-secondary shrink-0 disabled:opacity-60"
                            >
                                <UserCheck className="w-4 h-4" />
                                {assigningCoHead ? "Saving..." : "Save Co-Head"}
                            </button>
                        </form>
                    </div>
                )}
            </section>

            {/* Announcements & Members Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Club Announcements (2 cols) */}
                <section className="lg:col-span-2 card p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <Megaphone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                                Club Announcements
                            </h2>
                        </div>
                        {canManageThisClub && (
                            <button
                                type="button"
                                onClick={() => setShowAnnForm((prev) => !prev)}
                                className="btn-secondary text-xs"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                {showAnnForm ? "Cancel" : "New Announcement"}
                            </button>
                        )}
                    </div>

                    {canManageThisClub && showAnnForm && (
                        <form
                            onSubmit={handleCreateAnnouncement}
                            className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3"
                        >
                            <div>
                                <label htmlFor="ann-title" className="form-label">
                                    Title
                                </label>
                                <input
                                    id="ann-title"
                                    type="text"
                                    value={annForm.title}
                                    onChange={(e) =>
                                        setAnnForm({ ...annForm, title: e.target.value })
                                    }
                                    placeholder="Announcement title"
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="ann-content" className="form-label">
                                    Message
                                </label>
                                <textarea
                                    id="ann-content"
                                    rows={3}
                                    value={annForm.content}
                                    onChange={(e) =>
                                        setAnnForm({ ...annForm, content: e.target.value })
                                    }
                                    placeholder="Share updates with club members..."
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={annForm.isPinned}
                                        onChange={(e) =>
                                            setAnnForm({ ...annForm, isPinned: e.target.checked })
                                        }
                                        className="rounded border-slate-300"
                                    />
                                    Pin announcement
                                </label>
                                <button
                                    type="submit"
                                    disabled={postingAnn}
                                    className="btn-primary text-xs disabled:opacity-60"
                                >
                                    {postingAnn ? "Posting..." : "Post Announcement"}
                                </button>
                            </div>
                        </form>
                    )}

                    {announcementsRestricted ? (
                        <div className="p-6 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                Members-only announcements
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Join this club to view announcements from the Club Head.
                            </p>
                        </div>
                    ) : announcements.length === 0 ? (
                        <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                            No announcements posted yet.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {announcements.map((ann) => (
                                <article
                                    key={ann._id}
                                    className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {ann.isPinned && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300">
                                                        <Pin className="w-3 h-3" />
                                                        Pinned
                                                    </span>
                                                )}
                                                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                                                    {ann.title}
                                                </h3>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 whitespace-pre-line">
                                                {ann.content}
                                            </p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                                                Posted by {ann.createdBy?.name || "Coordinator"} ·{" "}
                                                {new Date(ann.createdAt).toLocaleDateString("en-IN", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </p>
                                        </div>

                                        {canManageThisClub && (
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => handleTogglePin(ann)}
                                                    title={ann.isPinned ? "Unpin" : "Pin"}
                                                    aria-label={ann.isPinned ? "Unpin announcement" : "Pin announcement"}
                                                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                                                >
                                                    <Pin className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteAnnouncement(ann._id)}
                                                    title="Delete"
                                                    aria-label="Delete announcement"
                                                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                {/* Club Member List (1 col) */}
                <section className="card p-6 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                                Members ({members.length})
                            </h2>
                        </div>
                    </div>

                    {members.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
                            No members have joined yet.
                        </p>
                    ) : (
                        <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
                            {members.map((m) => (
                                <li
                                    key={m._id}
                                    className="py-2.5 flex items-center justify-between gap-3"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                                            {m.user?.name}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                            {m.user?.course || m.user?.email}
                                            {m.user?.rollNo ? ` · ${m.user.rollNo}` : ""}
                                        </p>
                                    </div>
                                    <span
                                        className={`px-2 py-0.5 text-[11px] font-semibold rounded-full shrink-0 ${
                                            m.role === "head"
                                                ? "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300"
                                                : m.role === "co_head"
                                                  ? "bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300"
                                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                        }`}
                                    >
                                        {m.role === "head"
                                            ? "Head"
                                            : m.role === "co_head"
                                              ? "Co-Head"
                                              : "Member"}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
};

export default ClubDetails;

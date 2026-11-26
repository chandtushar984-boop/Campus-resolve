import { useCallback, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    AlertCircle,
    ArrowRight,
    Building2,
    Plus,
    Search,
    Users,
    X,
} from "lucide-react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { normalizeRole } from "../config/navigation";
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

const ClubsDirectory = () => {
    const { user } = useContext(AuthContext);
    const role = normalizeRole(user?.role);
    const isFaculty = role === "faculty";
    const isStudent = role === "student";

    const [clubs, setClubs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [busyClubId, setBusyClubId] = useState("");

    // Faculty create club modal/panel
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newClub, setNewClub] = useState({
        name: "",
        category: "Technical",
        description: "",
        logo: "",
    });

    const fetchClubs = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = {};
            if (category !== "All") params.category = category;
            if (search.trim()) params.search = search.trim();
            const res = await api.get("/clubs", { params });
            setClubs(res.data.clubs || []);
            setError("");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load clubs.");
        } finally {
            setIsLoading(false);
        }
    }, [category, search]);

    useEffect(() => {
        fetchClubs();
    }, [fetchClubs]);

    const handleJoinLeave = async (club) => {
        setBusyClubId(club._id);
        try {
            if (club.isMember) {
                const res = await api.delete(`/clubs/${club._id}/leave`);
                Toast.fire({ icon: "success", title: res.data.message || "Left club" });
                setClubs((prev) =>
                    prev.map((c) =>
                        c._id === club._id
                            ? { ...c, isMember: false, memberCount: res.data.memberCount }
                            : c
                    )
                );
            } else {
                const res = await api.post(`/clubs/${club._id}/join`);
                Toast.fire({ icon: "success", title: res.data.message || "Joined club" });
                setClubs((prev) =>
                    prev.map((c) =>
                        c._id === club._id
                            ? { ...c, isMember: true, memberCount: res.data.memberCount }
                            : c
                    )
                );
            }
        } catch (err) {
            Toast.fire({
                icon: "error",
                title: err.response?.data?.message || "Action failed.",
            });
        } finally {
            setBusyClubId("");
        }
    };

    const handleCreateClub = async (e) => {
        e.preventDefault();
        if (!newClub.name.trim() || !newClub.description.trim()) {
            Toast.fire({ icon: "error", title: "Name and description are required." });
            return;
        }
        setCreating(true);
        try {
            const res = await api.post("/clubs", newClub);
            Toast.fire({ icon: "success", title: res.data.message || "Club created" });
            setNewClub({ name: "", category: "Technical", description: "", logo: "" });
            setShowCreateForm(false);
            fetchClubs();
        } catch (err) {
            Toast.fire({
                icon: "error",
                title: err.response?.data?.message || "Failed to create club.",
            });
        } finally {
            setCreating(false);
        }
    };

    const detailBasePath = isFaculty ? "/faculty/clubs" : "/student/clubs";

    return (
        <div className="page-wrapper space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="page-title">
                        {isFaculty ? "Clubs & Organizers" : "University Clubs"}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {isFaculty
                            ? "Create university clubs, manage club profiles, and assign student Club Heads."
                            : "Explore recognized student clubs, view member counts, and join communities."}
                    </p>
                </div>
                {isFaculty && (
                    <button
                        type="button"
                        onClick={() => setShowCreateForm((prev) => !prev)}
                        className="btn-primary self-start sm:self-auto"
                    >
                        {showCreateForm ? (
                            <>
                                <X className="w-4 h-4" />
                                Cancel
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                Create Club
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Faculty Create Club Form */}
            {isFaculty && showCreateForm && (
                <section className="card p-6">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
                        Create New Club
                    </h2>
                    <form onSubmit={handleCreateClub} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="club-name" className="form-label">
                                    Club Name
                                </label>
                                <input
                                    id="club-name"
                                    type="text"
                                    value={newClub.name}
                                    onChange={(e) =>
                                        setNewClub({ ...newClub, name: e.target.value })
                                    }
                                    placeholder="e.g., AI & Robotics Society"
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="club-category" className="form-label">
                                    Category
                                </label>
                                <select
                                    id="club-category"
                                    value={newClub.category}
                                    onChange={(e) =>
                                        setNewClub({ ...newClub, category: e.target.value })
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
                            <label htmlFor="club-logo" className="form-label">
                                Club Logo URL (Optional)
                            </label>
                            <input
                                id="club-logo"
                                type="url"
                                value={newClub.logo}
                                onChange={(e) =>
                                    setNewClub({ ...newClub, logo: e.target.value })
                                }
                                placeholder="https://example.com/logo.png"
                                className="form-input"
                            />
                        </div>

                        <div>
                            <label htmlFor="club-desc" className="form-label">
                                Description
                            </label>
                            <textarea
                                id="club-desc"
                                rows={3}
                                value={newClub.description}
                                onChange={(e) =>
                                    setNewClub({ ...newClub, description: e.target.value })
                                }
                                placeholder="Describe the club's mission and activities..."
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowCreateForm(false)}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={creating}
                                className="btn-primary disabled:opacity-60"
                            >
                                {creating ? "Creating..." : "Create Club"}
                            </button>
                        </div>
                    </form>
                </section>
            )}

            {/* Search & Category Filters */}
            <div className="card p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search clubs by name or description..."
                        className="form-input pl-9"
                        aria-label="Search clubs"
                    />
                </div>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-input"
                    aria-label="Filter by category"
                >
                    <option value="All">All Categories</option>
                    {CLUB_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                            {cat}
                        </option>
                    ))}
                </select>
            </div>

            {/* Content */}
            {isLoading ? (
                <Loader label="Loading clubs..." />
            ) : error ? (
                <div className="card p-6 flex items-center gap-3 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                </div>
            ) : clubs.length === 0 ? (
                <div className="card p-12 text-center">
                    <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                        No clubs found
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {search || category !== "All"
                            ? "Try adjusting your search or category filter."
                            : "No university clubs have been created yet."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {clubs.map((club) => (
                        <article
                            key={club._id}
                            className="card p-5 flex flex-col justify-between gap-4"
                        >
                            <div>
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {club.logo ? (
                                            <img
                                                src={club.logo}
                                                alt={club.name}
                                                className="w-11 h-11 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                                            />
                                        ) : (
                                            <div className="w-11 h-11 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
                                                {club.name?.charAt(0)?.toUpperCase()}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <h2 className="font-semibold text-slate-900 dark:text-white text-base truncate">
                                                {club.name}
                                            </h2>
                                            <span className="inline-block mt-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                                                {club.category}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                                    {club.description}
                                </p>
                            </div>

                            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                    <span className="inline-flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5" />
                                        {club.memberCount} {club.memberCount === 1 ? "member" : "members"}
                                    </span>
                                    <span className="truncate max-w-[160px]">
                                        Head: {club.clubHead?.name || "Unassigned"}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Link
                                        to={`${detailBasePath}/${club._id}`}
                                        className="btn-secondary flex-1 text-xs no-underline"
                                    >
                                        View Details
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                    {isStudent && (
                                        <button
                                            type="button"
                                            disabled={busyClubId === club._id}
                                            onClick={() => handleJoinLeave(club)}
                                            className={`text-xs px-3.5 min-h-[42px] rounded-lg font-semibold transition-colors cursor-pointer disabled:opacity-60 ${
                                                club.isMember
                                                    ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 hover:bg-red-100 dark:hover:bg-red-950/70"
                                                    : "btn-primary"
                                            }`}
                                        >
                                            {busyClubId === club._id
                                                ? "..."
                                                : club.isMember
                                                  ? "Leave"
                                                  : "Join"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ClubsDirectory;

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, BookmarkCheck, Compass, Users } from "lucide-react";
import api from "../services/api";
import Loader from "../components/Loader";
import { Toast } from "../utils/toast";

const MyClubs = () => {
    const [clubs, setClubs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [leavingId, setLeavingId] = useState("");

    const fetchMyClubs = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await api.get("/clubs/my-clubs");
            setClubs(res.data.clubs || []);
            setError("");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load your clubs.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMyClubs();
    }, [fetchMyClubs]);

    const handleLeave = async (club) => {
        setLeavingId(club._id);
        try {
            const res = await api.delete(`/clubs/${club._id}/leave`);
            Toast.fire({ icon: "success", title: res.data.message || "Left club" });
            setClubs((prev) => prev.filter((c) => c._id !== club._id));
        } catch (err) {
            Toast.fire({
                icon: "error",
                title: err.response?.data?.message || "Could not leave club.",
            });
        } finally {
            setLeavingId("");
        }
    };

    return (
        <div className="page-wrapper space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="page-title">My Clubs</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Clubs you have joined and their latest announcements.
                    </p>
                </div>
                <Link to="/student/clubs" className="btn-primary no-underline self-start sm:self-auto">
                    <Compass className="w-4 h-4" />
                    Browse All Clubs
                </Link>
            </div>

            {isLoading ? (
                <Loader label="Loading your clubs..." />
            ) : error ? (
                <div className="card p-6 flex items-center gap-3 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                </div>
            ) : clubs.length === 0 ? (
                <div className="card p-12 text-center">
                    <BookmarkCheck className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                        You haven&apos;t joined any clubs yet
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                        Explore the university clubs directory to join technical, cultural, and student communities.
                    </p>
                    <Link to="/student/clubs" className="btn-primary mt-5 no-underline">
                        Explore Clubs
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {clubs.map((club) => (
                        <article
                            key={club._id}
                            className="card p-5 flex flex-col justify-between gap-4"
                        >
                            <div>
                                <div className="flex items-center gap-3 mb-3">
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

                                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
                                    {club.description}
                                </p>
                            </div>

                            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                    <span className="inline-flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5" />
                                        {club.memberCount} {club.memberCount === 1 ? "member" : "members"}
                                    </span>
                                    <span>
                                        Joined{" "}
                                        {new Date(club.joinedAt).toLocaleDateString("en-IN", {
                                            day: "numeric",
                                            month: "short",
                                        })}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Link
                                        to={`/student/clubs/${club._id}`}
                                        className="btn-secondary flex-1 text-xs no-underline"
                                    >
                                        Open Club
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                    <button
                                        type="button"
                                        disabled={leavingId === club._id}
                                        onClick={() => handleLeave(club)}
                                        className="px-3.5 min-h-[42px] rounded-lg text-xs font-semibold bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 hover:bg-red-100 dark:hover:bg-red-950/70 transition-colors cursor-pointer disabled:opacity-60"
                                    >
                                        {leavingId === club._id ? "..." : "Leave"}
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

export default MyClubs;

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    AlertCircle,
    ArrowRight,
    CalendarDays,
    MapPin,
    Search,
    Star,
    Users,
} from "lucide-react";
import api from "../services/api";
import Loader from "../components/Loader";
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

const formatDateTime = (date) =>
    new Date(date).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

const ExploreEvents = () => {
    const [events, setEvents] = useState([]);
    const [clubs, setClubs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [clubFilter, setClubFilter] = useState("All");
    const [timeframe, setTimeframe] = useState("upcoming");

    useEffect(() => {
        api.get("/clubs")
            .then((res) => setClubs(res.data.clubs || []))
            .catch(() => setClubs([]));
    }, []);

    const fetchEvents = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = { timeframe };
            if (search.trim()) params.search = search.trim();
            if (category !== "All") params.category = category;
            if (clubFilter !== "All") params.club = clubFilter;

            const res = await api.get("/events", { params });
            setEvents(res.data.events || []);
            setError("");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load events.");
        } finally {
            setIsLoading(false);
        }
    }, [search, category, clubFilter, timeframe]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    return (
        <div className="page-wrapper space-y-6">
            <div>
                <h1 className="page-title">Explore Events</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Browse approved university events, workshops, and club activities.
                </p>
            </div>

            {/* Search & Filters */}
            <div className="card p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search events by title..."
                        className="form-input pl-9"
                        aria-label="Search events by title"
                    />
                </div>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-input"
                    aria-label="Filter by category"
                >
                    <option value="All">All Categories</option>
                    {EVENT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                            {cat}
                        </option>
                    ))}
                </select>
                <select
                    value={clubFilter}
                    onChange={(e) => setClubFilter(e.target.value)}
                    className="form-input"
                    aria-label="Filter by club"
                >
                    <option value="All">All Clubs</option>
                    {clubs.map((c) => (
                        <option key={c._id} value={c._id}>
                            {c.name}
                        </option>
                    ))}
                </select>
                <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    className="form-input"
                    aria-label="Filter by timeframe"
                >
                    <option value="upcoming">Upcoming Events</option>
                    <option value="past">Past Events</option>
                    <option value="all">All Dates</option>
                </select>
            </div>

            {isLoading ? (
                <Loader label="Loading events..." />
            ) : error ? (
                <div className="card p-6 flex items-center gap-3 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                </div>
            ) : events.length === 0 ? (
                <div className="card p-12 text-center">
                    <CalendarDays className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                        No approved events found
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {search || category !== "All" || clubFilter !== "All"
                            ? "Try adjusting your search or filters."
                            : "Approved campus events will appear here."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {events.map((event) => {
                        const poster = resolvePosterUrl(event.posterImage);
                        return (
                            <article
                                key={event._id}
                                className="card overflow-hidden flex flex-col justify-between"
                            >
                                <div>
                                    {poster ? (
                                        <img
                                            src={poster}
                                            alt={event.title}
                                            className="w-full h-44 object-cover border-b border-slate-200 dark:border-slate-800"
                                        />
                                    ) : (
                                        <div className="w-full h-36 bg-gradient-to-br from-indigo-50 to-slate-100 dark:from-indigo-950/50 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-center">
                                            <CalendarDays className="w-10 h-10 text-indigo-400" />
                                        </div>
                                    )}

                                    <div className="p-5 space-y-2.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                                                {event.category}
                                            </span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                {event.club?.name}
                                            </span>
                                        </div>
                                        <h2 className="font-semibold text-base text-slate-900 dark:text-white line-clamp-1">
                                            {event.title}
                                        </h2>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                                            {event.description}
                                        </p>

                                        <div className="pt-2 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                                            <p className="flex items-center gap-1.5">
                                                <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                                                <span>{formatDateTime(event.startDateTime)}</span>
                                            </p>
                                            <p className="flex items-center gap-1.5">
                                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                <span className="truncate">{event.venue}</span>
                                            </p>
                                            <p className="flex items-center gap-1.5">
                                                <Users className="w-3.5 h-3.5 shrink-0" />
                                                <span>
                                                    {event.registeredCount || 0} / {event.seatCapacity} Seats Filled
                                                </span>
                                            </p>
                                            <p className="flex items-center gap-1.5">
                                                <Star className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                                                <span>
                                                    {event.reviewCount > 0
                                                        ? `${event.averageRating} (${event.reviewCount} ${event.reviewCount === 1 ? "review" : "reviews"})`
                                                        : "No reviews yet"}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-5 pb-5">
                                    <Link
                                        to={`/events/${event._id}`}
                                        className="btn-secondary w-full text-xs no-underline"
                                    >
                                        View Event Details
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ExploreEvents;

import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    AlertCircle,
    ArrowRight,
    Bell,
    BookmarkCheck,
    CalendarDays,
    Compass,
    FileText,
    Ticket,
    Users,
} from "lucide-react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

const getStatusBadgeClass = (status) => {
    switch (status) {
        case "Open":
            return "badge-open";
        case "In Progress":
            return "badge-inprogress";
        case "Resolved":
            return "badge-resolved";
        case "Rejected":
            return "badge-rejected";
        default:
            return "badge-low";
    }
};

const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

const formatDateTime = (date) =>
    new Date(date).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });

const StudentDashboard = () => {
    const { user } = useContext(AuthContext);

    const [issues, setIssues] = useState([]);
    const [myClubs, setMyClubs] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;
        Promise.allSettled([
            api.get("/issues/my-issues"),
            api.get("/clubs/my-clubs"),
            api.get("/analytics/student"),
        ])
            .then(([issuesRes, clubsRes, analyticsRes]) => {
                if (!isMounted) return;
                if (issuesRes.status === "fulfilled") {
                    setIssues(issuesRes.value.data.issues || []);
                    setError("");
                } else {
                    setError(
                        issuesRes.reason?.response?.data?.message ||
                            "Unable to load your campus activity right now."
                    );
                    setIssues([]);
                }

                if (clubsRes.status === "fulfilled") {
                    setMyClubs(clubsRes.value.data.clubs || []);
                } else {
                    setMyClubs([]);
                }

                if (analyticsRes.status === "fulfilled") {
                    setAnalytics(analyticsRes.value.data.analytics || null);
                } else {
                    setAnalytics(null);
                }
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const openIssuesCount = issues.filter((i) => i.status === "Open").length;
    const recentIssues = [...issues]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 4);

    const upcomingEvents = analytics?.upcomingRegisteredEvents || [];
    const recentNotifications = analytics?.recentNotifications || [];
    const activeTicketsCount = analytics?.activeTicketsCount ?? 0;

    const summaryCards = [
        {
            label: "Upcoming Events",
            value: isLoading ? "—" : upcomingEvents.length,
            hint: "Registered events",
            icon: CalendarDays,
            to: "/student/events",
        },
        {
            label: "Joined Clubs",
            value: isLoading ? "—" : myClubs.length,
            hint: "Active memberships",
            icon: Users,
            to: "/student/my-clubs",
        },
        {
            label: "My Tickets",
            value: isLoading ? "—" : activeTicketsCount,
            hint: "Active QR passes",
            icon: Ticket,
            to: "/student/my-tickets",
        },
        {
            label: "Campus Issues",
            value: isLoading ? "—" : issues.length,
            hint: isLoading ? "Loading..." : `${openIssuesCount} open`,
            icon: FileText,
            to: "/student/my-issues",
        },
    ];

    return (
        <div className="page-wrapper space-y-6">
            {/* Welcome Header */}
            <section className="card p-6 sm:p-8 bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-900 dark:to-slate-900 border-indigo-600/20 text-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-200 mb-1">
                            Student Dashboard
                        </p>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
                            Welcome back, {user?.name || "Student"}
                        </h1>
                        <p className="text-sm text-indigo-100 mt-1.5">
                            {[
                                user?.course,
                                user?.semester ? `Semester ${user.semester}` : null,
                                user?.rollNo ? `Roll No: ${user.rollNo}` : null,
                            ]
                                .filter(Boolean)
                                .join(" · ") ||
                                "Explore campus clubs, events, and your registrations."}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <Link
                            to="/student/events"
                            className="inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 rounded-lg bg-white text-indigo-700 font-semibold text-sm hover:bg-indigo-50 transition-colors no-underline"
                        >
                            <Compass className="w-4 h-4" />
                            Explore Events
                        </Link>
                        <Link
                            to="/student/my-tickets"
                            className="inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 rounded-lg bg-indigo-500/40 text-white border border-indigo-300/40 font-semibold text-sm hover:bg-indigo-500/60 transition-colors no-underline"
                        >
                            <Ticket className="w-4 h-4" />
                            My Tickets
                        </Link>
                    </div>
                </div>
            </section>

            {/* Summary Stats */}
            <section aria-label="Student overview statistics">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {summaryCards.map((card) => {
                        const Icon = card.icon;
                        return (
                            <Link
                                key={card.label}
                                to={card.to}
                                className="card p-5 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors no-underline block"
                            >
                                <div className="flex items-center justify-between gap-3 mb-3">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        {card.label}
                                    </span>
                                    <span className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                        <Icon className="w-4 h-4" />
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {card.value}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    {card.hint}
                                </p>
                            </Link>
                        );
                    })}
                </div>
            </section>

            {/* Primary Club & Event Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Registered Events */}
                <section className="card p-6 flex flex-col">
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2.5">
                            <CalendarDays className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                                Upcoming Registered Events
                            </h2>
                        </div>
                        <Link
                            to="/student/my-tickets"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline no-underline"
                        >
                            My Tickets
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    {upcomingEvents.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
                            <CalendarDays className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-2.5" />
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                No upcoming registered events
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                                Events you register for will appear here with dates, venues, and ticket access.
                            </p>
                            <Link
                                to="/student/events"
                                className="btn-secondary mt-4 text-xs no-underline"
                            >
                                Find Campus Events
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden">
                            {upcomingEvents.slice(0, 4).map((reg) => (
                                <Link
                                    key={reg._id}
                                    to={`/events/${reg.event._id}`}
                                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors no-underline"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                                            {reg.event.title}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                            {formatDateTime(reg.event.startDateTime)} · {reg.event.venue}
                                        </p>
                                    </div>
                                    <span className="font-mono text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 shrink-0">
                                        {reg.ticketCode}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                {/* Joined Clubs */}
                <section className="card p-6 flex flex-col">
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2.5">
                            <BookmarkCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                                Joined Clubs
                            </h2>
                        </div>
                        <Link
                            to="/student/my-clubs"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline no-underline"
                        >
                            View My Clubs
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    {myClubs.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
                            <Users className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-2.5" />
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                You haven&apos;t joined any clubs yet
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                                Discover technical, cultural, and sports clubs across campus and stay updated on their activities.
                            </p>
                            <Link
                                to="/student/clubs"
                                className="btn-secondary mt-4 text-xs no-underline"
                            >
                                Browse Clubs
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden">
                            {myClubs.slice(0, 4).map((club) => (
                                <Link
                                    key={club._id}
                                    to={`/student/clubs/${club._id}`}
                                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors no-underline"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                                            {club.name}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {club.category} · {club.memberCount} members
                                        </p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {/* Recent Notifications */}
            <section className="card p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2.5">
                        <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <div>
                            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                                Recent Notifications
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {analytics?.unreadNotificationsCount > 0
                                    ? `${analytics.unreadNotificationsCount} unread`
                                    : "Latest event and club updates"}
                            </p>
                        </div>
                    </div>
                </div>

                {recentNotifications.length === 0 ? (
                    <div className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                        No notifications yet.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden">
                        {recentNotifications.map((notif) => (
                            <Link
                                key={notif._id}
                                to={notif.link || "/student/events"}
                                className={`flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors no-underline ${
                                    notif.read ? "" : "bg-indigo-50/40 dark:bg-indigo-950/20"
                                }`}
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                                        {notif.title}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                        {notif.message}
                                    </p>
                                </div>
                                <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                                    {formatDate(notif.createdAt)}
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            {/* Existing Campus Issues Section (Live API Data) */}
            <section className="card p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                            Recent Campus Issues
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Track grievances and campus requests you have submitted
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            to="/student/my-issues"
                            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline no-underline"
                        >
                            View all
                        </Link>
                        <Link
                            to="/student/create-issue"
                            className="btn-primary text-xs no-underline"
                        >
                            Raise Issue
                        </Link>
                    </div>
                </div>

                {isLoading ? (
                    <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        Loading your campus issues...
                    </div>
                ) : error ? (
                    <div className="flex items-center gap-2.5 p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-sm text-red-700 dark:text-red-300">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                ) : recentIssues.length === 0 ? (
                    <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        No campus issues submitted yet.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden">
                        {recentIssues.map((issue) => (
                            <Link
                                key={issue._id}
                                to={`/student/issue/${issue._id}`}
                                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors no-underline"
                            >
                                <div className="min-w-0 flex items-center gap-3">
                                    <span className={`badge ${getStatusBadgeClass(issue.status)}`}>
                                        {issue.status}
                                    </span>
                                    <span className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                                        {issue.title}
                                    </span>
                                </div>
                                <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                                    {formatDate(issue.createdAt)}
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default StudentDashboard;

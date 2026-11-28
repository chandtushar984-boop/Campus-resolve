import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowRight,
    Building2,
    CalendarRange,
    ClipboardList,
    Clock,
    Megaphone,
    Users,
} from "lucide-react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

const ClubHeadDashboard = () => {
    const { user } = useContext(AuthContext);
    const clubId = user?.managedClub?._id || user?.managedClub || "";

    const [club, setClub] = useState(null);
    const [events, setEvents] = useState([]);
    const [announcementsCount, setAnnouncementsCount] = useState(0);
    const [isLoading, setIsLoading] = useState(Boolean(clubId));

    useEffect(() => {
        if (!clubId) {
            setIsLoading(false);
            return;
        }
        let isMounted = true;
        Promise.allSettled([
            api.get(`/clubs/${clubId}`),
            api.get(`/clubs/${clubId}/announcements`),
            api.get("/events/my-club"),
        ])
            .then(([clubRes, annRes, eventsRes]) => {
                if (!isMounted) return;
                if (clubRes.status === "fulfilled") {
                    setClub(clubRes.value.data.club || null);
                }
                if (annRes.status === "fulfilled") {
                    setAnnouncementsCount((annRes.value.data.announcements || []).length);
                }
                if (eventsRes.status === "fulfilled") {
                    setEvents(eventsRes.value.data.events || []);
                }
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [clubId]);

    const approvedEventsCount = events.filter((e) => e.approvalStatus === "Approved").length;
    const pendingEventsCount = events.filter((e) => e.approvalStatus === "Pending").length;

    const clubStats = [
        {
            label: "Club Members",
            value: isLoading ? "—" : club?.memberCount ?? 0,
            hint: club ? club.name : "No club assigned",
            icon: Users,
            to: "/club-head/my-club",
        },
        {
            label: "Approved Events",
            value: isLoading ? "—" : approvedEventsCount,
            hint: `${events.length} total created`,
            icon: CalendarRange,
            to: "/club-head/events",
        },
        {
            label: "Pending Approvals",
            value: isLoading ? "—" : pendingEventsCount,
            hint: "Awaiting faculty review",
            icon: Clock,
            to: "/club-head/events",
        },
        {
            label: "Announcements",
            value: isLoading ? "—" : announcementsCount,
            hint: "Posted to club members",
            icon: Megaphone,
            to: "/club-head/announcements",
        },
    ];

    return (
        <div className="page-wrapper space-y-6">
            {/* Header */}
            <section className="card p-6 sm:p-8 bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-900 dark:to-slate-900 border-indigo-600/20 text-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-200 mb-1">
                            Club Head Dashboard
                        </p>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
                            Welcome, {user?.name || "Club Coordinator"}
                        </h1>
                        <p className="text-sm text-indigo-100 mt-1.5">
                            {club
                                ? `Managing ${club.name} (${club.category})`
                                : "Manage your club profile, coordinate events, and post announcements."}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <Link
                            to="/club-head/my-club"
                            className="inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 rounded-lg bg-white text-indigo-700 font-semibold text-sm hover:bg-indigo-50 transition-colors no-underline"
                        >
                            <Building2 className="w-4 h-4" />
                            My Club
                        </Link>
                        <Link
                            to="/club-head/announcements"
                            className="inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 rounded-lg bg-indigo-500/40 text-white border border-indigo-300/40 font-semibold text-sm hover:bg-indigo-500/60 transition-colors no-underline"
                        >
                            <Megaphone className="w-4 h-4" />
                            Announcements
                        </Link>
                    </div>
                </div>
            </section>

            {/* Club Statistics */}
            <section aria-label="Club statistics">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {clubStats.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <Link
                                key={stat.label}
                                to={stat.to}
                                className="card p-5 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors no-underline block"
                            >
                                <div className="flex items-center justify-between gap-3 mb-3">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        {stat.label}
                                    </span>
                                    <span className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                        <Icon className="w-4 h-4" />
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {stat.value}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                                    {stat.hint}
                                </p>
                            </Link>
                        );
                    })}
                </div>
            </section>

            {/* Club & Event Management Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="card p-6 flex flex-col">
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2.5">
                            <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                                Club Overview
                            </h2>
                        </div>
                        <Link
                            to="/club-head/my-club"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline no-underline"
                        >
                            Open My Club
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                    {club ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0">
                                    {club.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                                        {club.name}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {club.category} · {club.memberCount} members
                                    </p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
                                {club.description}
                            </p>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
                            <Building2 className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-2.5" />
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                No club assigned yet
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                                Ask a Faculty coordinator to assign you as Club Head of a club.
                            </p>
                        </div>
                    )}
                </section>

                <section className="card p-6 flex flex-col">
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2.5">
                            <CalendarRange className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                                Event Management
                            </h2>
                        </div>
                        <Link
                            to="/club-head/events"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline no-underline"
                        >
                            View Events
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
                        <CalendarRange className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-2.5" />
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            No club events created yet
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                            Submitted event proposals, approval statuses, and schedules will be managed here.
                        </p>
                    </div>
                </section>
            </div>

            {/* Quick Links */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                    to="/club-head/registrations"
                    className="card p-5 flex items-center justify-between gap-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors no-underline"
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                            <ClipboardList className="w-5 h-5" />
                        </span>
                        <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                                Event Registrations
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                Review attendee lists and check-ins
                            </p>
                        </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                </Link>

                <Link
                    to="/club-head/announcements"
                    className="card p-5 flex items-center justify-between gap-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors no-underline"
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                            <Megaphone className="w-5 h-5" />
                        </span>
                        <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                                Club Announcements
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                Share updates with club members
                            </p>
                        </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                </Link>
            </section>
        </div>
    );
};

export default ClubHeadDashboard;

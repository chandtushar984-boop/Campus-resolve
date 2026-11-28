import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowRight,
    Building2,
    CalendarCheck,
    CalendarDays,
    CheckCircle2,
    Compass,
    MapPin,
    QrCode,
    ShieldCheck,
    Sparkles,
    Star,
    Users,
} from "lucide-react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { getDashboardPath, normalizeRole } from "../config/navigation";
import { resolvePosterUrl } from "../utils/posterUrl";
import campusHeroImg from "../assets/campus-hero.webp";

const highlights = [
    {
        title: "Discover Campus Clubs",
        desc: "Browse technical, cultural, and academic clubs across the university and join communities that match your interests.",
        icon: Users,
    },
    {
        title: "Event Discovery & QR Passes",
        desc: "Explore approved campus events, reserve your seat in seconds, and check in smoothly with your QR ticket.",
        icon: QrCode,
    },
    {
        title: "Faculty-Reviewed Approvals",
        desc: "Club Heads submit proposals with venue conflict checks while Faculty coordinators oversee campus-wide activities.",
        icon: ShieldCheck,
    },
];

const steps = [
    {
        step: "01",
        title: "Discover & Join",
        desc: "Explore active university clubs, follow announcements, and connect with student-led communities.",
        icon: Compass,
    },
    {
        step: "02",
        title: "Register & Get QR Pass",
        desc: "Book your seat for approved campus events before deadlines and access your digital pass anytime.",
        icon: CalendarCheck,
    },
    {
        step: "03",
        title: "Attend & Share Feedback",
        desc: "Check in at the venue, verify attendance, and rate events to help shape campus reputation.",
        icon: Sparkles,
    },
];

const roles = [
    {
        name: "Students",
        desc: "Explore upcoming events, join clubs, manage QR tickets, and track notifications from one dashboard.",
        icon: Compass,
    },
    {
        name: "Club Heads",
        desc: "Coordinate club profiles, propose events, verify QR tickets, export CSV rosters, and post announcements.",
        icon: Building2,
    },
    {
        name: "Faculty Coordinators",
        desc: "Approve event proposals with venue conflict detection and monitor university-wide analytics.",
        icon: CheckCircle2,
    },
];

const formatDateTime = (date) =>
    new Date(date).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });

const Landing = () => {
    const { user, token } = useContext(AuthContext);
    const isAuthenticated = Boolean(token && user);
    const dashboardPath = getDashboardPath(user?.role);
    const role = normalizeRole(user?.role);

    const [clubs, setClubs] = useState([]);
    const [events, setEvents] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        let isMounted = true;
        setLoadingData(true);
        Promise.allSettled([
            api.get("/clubs"),
            api.get("/events", { params: { timeframe: "upcoming" } }),
        ])
            .then(([clubsRes, eventsRes]) => {
                if (!isMounted) return;
                if (clubsRes.status === "fulfilled") {
                    setClubs((clubsRes.value.data.clubs || []).slice(0, 3));
                } else {
                    setClubs([]);
                }
                if (eventsRes.status === "fulfilled") {
                    setEvents((eventsRes.value.data.events || []).slice(0, 3));
                } else {
                    setEvents([]);
                }
            })
            .finally(() => {
                if (isMounted) setLoadingData(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const eventsLink = isAuthenticated
        ? role === "faculty"
            ? "/faculty/events"
            : "/student/events"
        : "/events";
    const clubsLink = isAuthenticated
        ? role === "faculty"
            ? "/faculty/clubs"
            : "/student/clubs"
        : "/clubs";

    return (
        <div className="bg-[#F3F1ED] dark:bg-[#0e0f14] text-[#1F1F23] dark:text-zinc-100">
            {/* 1. Split Hero Section */}
            <section
                id="hero"
                className="relative overflow-hidden border-b border-[#DCD7CE] dark:border-zinc-800/80 scroll-mt-20"
            >
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-28 right-0 w-96 h-96 rounded-full bg-[#6d5bd0]/10 dark:bg-[#6d5bd0]/15 blur-3xl"
                />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                        {/* Text Left (First on mobile) */}
                        <div className="lg:col-span-6 space-y-6 order-1">
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#6d5bd0]/10 dark:bg-[#6d5bd0]/20 text-[#5b48c4] dark:text-[#c4b5fd] border border-[#6d5bd0]/20">
                                Campus Clubs &amp; Events
                            </span>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.12]">
                                Your campus. Your community. Your moments.
                            </h1>
                            <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-xl">
                                CampusResolve helps students discover university clubs, explore approved campus events, reserve seats with QR passes, and stay connected with campus life.
                            </p>
                            <div className="flex flex-wrap items-center gap-3 pt-1">
                                {isAuthenticated ? (
                                    <>
                                        <Link
                                            to={dashboardPath}
                                            className="btn-primary no-underline px-5"
                                        >
                                            Open Dashboard
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>
                                        <Link
                                            to={eventsLink}
                                            className="btn-secondary no-underline px-5"
                                        >
                                            Explore Events
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            to={eventsLink}
                                            className="btn-primary no-underline px-5"
                                        >
                                            Explore Events
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>
                                        <Link
                                            to={clubsLink}
                                            className="btn-secondary no-underline px-5"
                                        >
                                            Discover Clubs
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Campus Image Right (Below text on mobile) */}
                        <div className="lg:col-span-6 order-2">
                            <div className="relative rounded-2xl overflow-hidden border border-[#DCD7CE] dark:border-zinc-800 bg-[#FAF9F6] dark:bg-[#171820] shadow-xl shadow-zinc-900/10 dark:shadow-black/40">
                                <div className="aspect-[16/10] w-full">
                                    <img
                                        src={campusHeroImg}
                                        alt="University campus aerial view"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="hidden sm:flex items-center justify-between gap-3 px-4 py-3 bg-[#FAF9F6]/92 dark:bg-[#171820]/90 backdrop-blur-md border-t border-[#DCD7CE] dark:border-zinc-800/80">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <MapPin className="w-4 h-4 text-[#6d5bd0] dark:text-[#a78bfa] shrink-0" />
                                        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200 truncate">
                                            University Campus · Clubs, Events &amp; Student Activities
                                        </span>
                                    </div>
                                    <span className="text-[11px] font-semibold text-[#6d5bd0] dark:text-[#a78bfa] shrink-0">
                                        CampusResolve
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Campus / Community Highlights */}
            <section
                id="about"
                className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20 scroll-mt-20"
            >
                <div className="max-w-2xl mb-10">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#6d5bd0] dark:text-[#a78bfa] mb-1.5">
                        Why CampusResolve
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                        Built for modern campus life
                    </h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1.5">
                        Structured workflows connecting students, club coordinators, and faculty.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {highlights.map((item) => {
                        const Icon = item.icon;
                        return (
                            <div key={item.title} className="card p-6">
                                <div className="w-10 h-10 rounded-lg bg-[#6d5bd0]/10 dark:bg-[#6d5bd0]/20 text-[#6d5bd0] dark:text-[#a78bfa] flex items-center justify-center mb-4">
                                    <Icon className="w-5 h-5" />
                                </div>
                                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 text-base mb-2">
                                    {item.title}
                                </h3>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                    {item.desc}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* 3. Featured Clubs */}
            <section
                id="clubs"
                className="bg-[#EAE7E1] dark:bg-[#13141b] border-y border-[#DCD7CE] dark:border-zinc-800/80 py-14 sm:py-20 scroll-mt-20"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-[#6d5bd0] dark:text-[#a78bfa] mb-1.5">
                                Student Organizations
                            </p>
                            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                                Featured Clubs
                            </h2>
                        </div>
                        <Link
                            to={clubsLink}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6d5bd0] dark:text-[#a78bfa] hover:underline no-underline"
                        >
                            View All Clubs
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {loadingData ? (
                        <div className="card p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                            Loading campus clubs...
                        </div>
                    ) : clubs.length === 0 ? (
                        <div className="card p-10 text-center space-y-2 bg-[#faf9f7] dark:bg-[#171820]">
                            <Building2 className="w-9 h-9 text-zinc-400 mx-auto" />
                            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                                No active clubs available yet
                            </h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                                Active university clubs and student organizations will appear here once published.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {clubs.map((club) => (
                                <article
                                    key={club._id}
                                    className="card p-6 flex flex-col justify-between gap-4"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-[#6d5bd0]/10 dark:bg-[#6d5bd0]/20 text-[#5b48c4] dark:text-[#c4b5fd]">
                                                {club.category}
                                            </span>
                                            {club.reviewCount > 0 && (
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                                                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                                                    {club.averageRating} ({club.reviewCount})
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-50">
                                            {club.name}
                                        </h3>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3">
                                            {club.description}
                                        </p>
                                    </div>
                                    <div className="pt-3 border-t border-stone-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                                        <span className="inline-flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5" />
                                            {club.memberCount} members
                                        </span>
                                        <Link
                                            to={
                                                isAuthenticated
                                                    ? role === "faculty"
                                                        ? `/faculty/clubs/${club._id}`
                                                        : `/student/clubs/${club._id}`
                                                    : `/clubs/${club._id}`
                                            }
                                            className="font-semibold text-[#6d5bd0] dark:text-[#a78bfa] no-underline hover:underline"
                                        >
                                            View Club
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* 4. Upcoming Events */}
            <section
                id="events"
                className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20 scroll-mt-20"
            >
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#6d5bd0] dark:text-[#a78bfa] mb-1.5">
                            Campus Calendar
                        </p>
                        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                            Upcoming Events
                        </h2>
                    </div>
                    <Link
                        to={eventsLink}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6d5bd0] dark:text-[#a78bfa] hover:underline no-underline"
                    >
                        Explore All Events
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {loadingData ? (
                    <div className="card p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                        Loading upcoming events...
                    </div>
                ) : events.length === 0 ? (
                    <div className="card p-10 text-center space-y-2">
                        <CalendarDays className="w-9 h-9 text-zinc-400 mx-auto" />
                        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                            No upcoming approved events yet
                        </h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                            Approved campus events with open registration will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {events.map((ev) => {
                            const poster = resolvePosterUrl(ev.posterImage);
                            return (
                                <article
                                    key={ev._id}
                                    className="card overflow-hidden flex flex-col justify-between"
                                >
                                    <div>
                                        {poster && (
                                            <img
                                                src={poster}
                                                alt={ev.title}
                                                className="w-full h-40 object-cover border-b border-stone-200 dark:border-zinc-800"
                                            />
                                        )}
                                        <div className="p-6 space-y-2.5">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-[#6d5bd0]/10 dark:bg-[#6d5bd0]/20 text-[#5b48c4] dark:text-[#c4b5fd]">
                                                    {ev.category}
                                                </span>
                                                <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                                    {ev.club?.name}
                                                </span>
                                            </div>
                                            <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-50 line-clamp-1">
                                                {ev.title}
                                            </h3>
                                            <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                                                {ev.description}
                                            </p>
                                            <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400 pt-1">
                                                <p className="flex items-center gap-1.5">
                                                    <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                                                    <span>{formatDateTime(ev.startDateTime)}</span>
                                                </p>
                                                <p className="flex items-center gap-1.5">
                                                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                    <span className="truncate">{ev.venue}</span>
                                                </p>
                                                <p className="flex items-center gap-1.5">
                                                    <Users className="w-3.5 h-3.5 shrink-0" />
                                                    <span>
                                                        {ev.registeredCount || 0} / {ev.seatCapacity} Seats Filled
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-6 pb-6">
                                        <Link
                                            to={`/events/${ev._id}`}
                                            className="btn-secondary text-xs w-full no-underline"
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
            </section>

            {/* 5. How CampusResolve Works & Role Workspaces */}
            <section
                id="activities"
                className="bg-[#EAE7E1] dark:bg-[#13141b] border-y border-[#DCD7CE] dark:border-zinc-800/80 py-14 sm:py-20 scroll-mt-20"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-14">
                    <div>
                        <div className="max-w-2xl mb-10">
                            <p className="text-xs font-semibold uppercase tracking-wider text-[#6d5bd0] dark:text-[#a78bfa] mb-1.5">
                                Campus Activities
                            </p>
                            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                                How CampusResolve works
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {steps.map((item) => {
                                const Icon = item.icon;
                                return (
                                <div
                                    key={item.step}
                                    className="p-6 rounded-xl border border-[#DCD7CE] dark:border-zinc-800 bg-[#FAF9F6] dark:bg-[#171820]"
                                >
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-xs font-bold tracking-wider text-[#6d5bd0] dark:text-[#a78bfa]">
                                                STEP {item.step}
                                            </span>
                                            <Icon className="w-4 h-4 text-zinc-400" />
                                        </div>
                                        <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-50 mb-1.5">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                            {item.desc}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <div className="max-w-2xl mb-8">
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                                Role-based workspaces
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                                Tailored navigation and permissions for every campus role.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {roles.map((r) => {
                                const Icon = r.icon;
                                return (
                                <div
                                    key={r.name}
                                    className="p-6 rounded-xl border border-[#DCD7CE] dark:border-zinc-800 bg-[#FAF9F6] dark:bg-[#171820]"
                                >
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="w-9 h-9 rounded-lg bg-[#6d5bd0] text-white flex items-center justify-center shrink-0">
                                                <Icon className="w-4 h-4" />
                                            </span>
                                            <h4 className="font-semibold text-zinc-900 dark:text-zinc-50 text-base">
                                                {r.name}
                                            </h4>
                                        </div>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                            {r.desc}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. Final CTA & Contact */}
            <section
                id="contact"
                className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20 scroll-mt-20"
            >
                <div className="card p-8 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#FAF9F6] dark:bg-[#171820]">
                    <div className="space-y-2 max-w-xl">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#6d5bd0] dark:text-[#a78bfa]">
                            Get Connected
                        </p>
                        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                            Ready to join your campus community?
                        </h2>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            Sign in with your university email to register for upcoming events, manage club memberships, or coordinate campus activities.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                        {isAuthenticated ? (
                            <Link
                                to={dashboardPath}
                                className="btn-primary no-underline px-5"
                            >
                                Go to Dashboard
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        ) : (
                            <>
                                <Link
                                    to="/register"
                                    className="btn-primary no-underline px-5"
                                >
                                    Create Account
                                </Link>
                                <Link
                                    to="/login"
                                    className="btn-secondary no-underline px-5"
                                >
                                    Sign In
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Landing;

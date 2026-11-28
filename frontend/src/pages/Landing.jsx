import { useContext } from "react";
import { Link } from "react-router-dom";
import {
    Building2,
    CalendarCheck,
    CheckCircle2,
    Compass,
    ShieldCheck,
    Users,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { getDashboardPath } from "../config/navigation";

const features = [
    {
        title: "Discover Campus Clubs",
        desc: "Browse technical, cultural, and academic clubs across the university and join communities that match your interests.",
        icon: Users,
    },
    {
        title: "Event Discovery & Tickets",
        desc: "Explore approved campus events, register in seconds, and keep your event passes organized in one place.",
        icon: CalendarCheck,
    },
    {
        title: "Streamlined Faculty Approvals",
        desc: "Club Heads submit proposals and Faculty coordinators review, approve, and oversee campus-wide activities.",
        icon: ShieldCheck,
    },
];

const roles = [
    {
        name: "Students",
        desc: "Explore upcoming events, join clubs, and manage your tickets from a personalized dashboard.",
        icon: Compass,
    },
    {
        name: "Club Heads",
        desc: "Coordinate club profiles, organize events, track registrations, and share announcements.",
        icon: Building2,
    },
    {
        name: "Faculty Coordinators",
        desc: "Review event proposals, monitor club operations, and view university-wide analytics.",
        icon: CheckCircle2,
    },
];

const Landing = () => {
    const { user, token } = useContext(AuthContext);
    const dashboardPath = getDashboardPath(user?.role);

    return (
        <div className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
            {/* Hero */}
            <section className="bg-gradient-to-b from-indigo-700 to-indigo-800 dark:from-slate-900 dark:to-slate-950 text-white border-b border-indigo-600/20 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-24 text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-indigo-100 border border-white/15 mb-6">
                        University Club &amp; Event Management System
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-5 leading-tight max-w-3xl mx-auto">
                        One unified portal for campus clubs, events, and approvals
                    </h1>
                    <p className="text-base sm:text-lg text-indigo-100 dark:text-slate-300 max-w-2xl mx-auto mb-9 leading-relaxed">
                        Connect students, club coordinators, and faculty in a single organized workspace—from discovering events to managing approvals.
                    </p>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                        {token && user ? (
                            <Link
                                to={dashboardPath}
                                className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 bg-white text-indigo-700 font-semibold rounded-lg shadow-sm hover:bg-indigo-50 transition-colors text-sm no-underline"
                            >
                                Open Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    to="/register"
                                    className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 bg-white text-indigo-700 font-semibold rounded-lg shadow-sm hover:bg-indigo-50 transition-colors text-sm no-underline"
                                >
                                    Get Started
                                </Link>
                                <Link
                                    to="/login"
                                    className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 bg-indigo-600/70 dark:bg-slate-800 text-white font-semibold rounded-lg border border-indigo-400/40 dark:border-slate-700 hover:bg-indigo-600 dark:hover:bg-slate-700 transition-colors text-sm no-underline"
                                >
                                    Sign In
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                        Built for campus life
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Structured workflows for every role on campus.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {features.map((feature) => {
                        const Icon = feature.icon;
                        return (
                            <div key={feature.title} className="card p-6">
                                <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                                    <Icon className="w-5 h-5" />
                                </div>
                                <h3 className="font-semibold text-slate-900 dark:text-white text-base mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                    {feature.desc}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Roles */}
            <section className="bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                            Role-based workspaces
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Tailored navigation and dashboards for students, club heads, and faculty.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {roles.map((role) => {
                            const Icon = role.icon;
                            return (
                                <div
                                    key={role.name}
                                    className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                                            <Icon className="w-4 h-4" />
                                        </span>
                                        <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                                            {role.name}
                                        </h3>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                        {role.desc}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Landing;

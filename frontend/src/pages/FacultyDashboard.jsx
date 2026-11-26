import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    AlertCircle,
    ArrowRight,
    BarChart3,
    Building2,
    CalendarDays,
    CheckSquare,
    FileText,
} from "lucide-react";
import api from "../services/api";
import Loader from "../components/Loader";
import { AuthContext } from "../context/AuthContext";

const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

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

const getPriorityBadgeClass = (priority) => {
    switch (priority) {
        case "Low":
            return "badge-low";
        case "Medium":
            return "badge-medium";
        case "High":
            return "badge-high";
        default:
            return "badge-low";
    }
};

const FacultyDashboard = () => {
    const { user } = useContext(AuthContext);
    const [issues, setIssues] = useState([]);
    const [clubsCount, setClubsCount] = useState(0);
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [sortOrder, setSortOrder] = useState("newest");

    useEffect(() => {
        let isMounted = true;
        Promise.allSettled([
            api.get("/issues"),
            api.get("/clubs"),
            api.get("/events/manage"),
        ])
            .then(([issuesRes, clubsRes, eventsRes]) => {
                if (!isMounted) return;
                if (issuesRes.status === "fulfilled") {
                    setIssues(issuesRes.value.data.issues || []);
                    setError("");
                } else {
                    setError(
                        issuesRes.reason?.response?.data?.message ||
                            "Unable to load campus records right now."
                    );
                }

                if (clubsRes.status === "fulfilled") {
                    setClubsCount((clubsRes.value.data.clubs || []).length);
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
    }, []);

    const filteredIssues = useMemo(() => {
        let result = [...issues];

        if (search.trim()) {
            const q = search.trim().toLowerCase();
            result = result.filter((i) => i.title?.toLowerCase().includes(q));
        }
        if (statusFilter !== "All") {
            result = result.filter((i) => i.status === statusFilter);
        }
        if (priorityFilter !== "All") {
            result = result.filter((i) => i.priority === priorityFilter);
        }

        result.sort((a, b) =>
            sortOrder === "newest"
                ? new Date(b.createdAt) - new Date(a.createdAt)
                : new Date(a.createdAt) - new Date(b.createdAt)
        );

        return result;
    }, [issues, search, statusFilter, priorityFilter, sortOrder]);

    const openIssuesCount = issues.filter((i) => i.status === "Open").length;
    const pendingApprovalsCount = events.filter((e) => e.approvalStatus === "Pending").length;
    const approvedEventsCount = events.filter((e) => e.approvalStatus === "Approved").length;

    const approvalStats = [
        {
            label: "Pending Approvals",
            value: isLoading ? "—" : pendingApprovalsCount,
            hint: "Event requests awaiting review",
            icon: CheckSquare,
            to: "/faculty/approvals",
        },
        {
            label: "Active Clubs",
            value: isLoading ? "—" : clubsCount,
            hint: "Registered student organizations",
            icon: Building2,
            to: "/faculty/clubs",
        },
        {
            label: "Scheduled Events",
            value: isLoading ? "—" : approvedEventsCount,
            hint: "Approved university events",
            icon: CalendarDays,
            to: "/faculty/events",
        },
        {
            label: "Campus Issues",
            value: isLoading ? "—" : issues.length,
            hint: isLoading ? "Loading..." : `${openIssuesCount} open`,
            icon: FileText,
            to: "#issues",
        },
    ];

    const overviewLinks = [
        {
            title: "Event Approvals",
            desc: "Review and approve club event proposals",
            icon: CheckSquare,
            to: "/faculty/approvals",
        },
        {
            title: "Clubs & Organizers",
            desc: "Oversee university clubs and student heads",
            icon: Building2,
            to: "/faculty/clubs",
        },
        {
            title: "University Events",
            desc: "Monitor upcoming and past campus events",
            icon: CalendarDays,
            to: "/faculty/events",
        },
        {
            title: "Analytics",
            desc: "View participation and approval trends",
            icon: BarChart3,
            to: "/faculty/analytics",
        },
    ];

    if (isLoading) return <Loader label="Loading faculty dashboard..." />;

    return (
        <div className="page-wrapper space-y-6">
            {/* Welcome Header */}
            <section className="card p-6 sm:p-8 bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-900 dark:to-slate-900 border-indigo-600/20 text-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-200 mb-1">
                            Faculty Dashboard
                        </p>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
                            Welcome, {user?.name || "Faculty Coordinator"}
                        </h1>
                        <p className="text-sm text-indigo-100 mt-1.5">
                            Oversee event approvals, university clubs, and campus-wide activity.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <Link
                            to="/faculty/approvals"
                            className="inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 rounded-lg bg-white text-indigo-700 font-semibold text-sm hover:bg-indigo-50 transition-colors no-underline"
                        >
                            <CheckSquare className="w-4 h-4" />
                            Event Approvals
                        </Link>
                        <Link
                            to="/faculty/clubs"
                            className="inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 rounded-lg bg-indigo-500/40 text-white border border-indigo-300/40 font-semibold text-sm hover:bg-indigo-500/60 transition-colors no-underline"
                        >
                            <Building2 className="w-4 h-4" />
                            Clubs &amp; Organizers
                        </Link>
                    </div>
                </div>
            </section>

            {/* Approval Statistics */}
            <section aria-label="Approval statistics">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {approvalStats.map((stat) => {
                        const Icon = stat.icon;
                        const content = (
                            <>
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
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    {stat.hint}
                                </p>
                            </>
                        );

                        return stat.to.startsWith("#") ? (
                            <a
                                key={stat.label}
                                href={stat.to}
                                className="card p-5 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors no-underline block"
                            >
                                {content}
                            </a>
                        ) : (
                            <Link
                                key={stat.label}
                                to={stat.to}
                                className="card p-5 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors no-underline block"
                            >
                                {content}
                            </Link>
                        );
                    })}
                </div>
            </section>

            {/* University Overview */}
            <section className="card p-6">
                <div className="mb-4">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                        University Overview
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Quick access to approval workflows, club directories, and event monitoring
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {overviewLinks.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.title}
                                to={item.to}
                                className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors no-underline flex flex-col justify-between gap-3"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <span className="w-9 h-9 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                        <Icon className="w-4 h-4" />
                                    </span>
                                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                                        {item.title}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        {item.desc}
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </section>

            {/* Existing Campus Issues Management (Live API Data) */}
            <section id="issues" className="card p-6 scroll-mt-24">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                            Campus Issues
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Review and manage reported campus grievances
                        </p>
                    </div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {filteredIssues.length} of {issues.length} records
                    </span>
                </div>

                {error && (
                    <div className="mb-4 flex items-center gap-2.5 p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-sm text-red-700 dark:text-red-300">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {issues.length === 0 && !error ? (
                    <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                        No campus issues reported yet.
                    </div>
                ) : (
                    <>
                        {/* Filters */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                            <input
                                type="text"
                                placeholder="Search by title..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="form-input"
                                aria-label="Search issues by title"
                            />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="form-input"
                                aria-label="Filter by status"
                            >
                                <option value="All">All Statuses</option>
                                <option value="Open">Open</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Resolved">Resolved</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                            <select
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                                className="form-input"
                                aria-label="Filter by priority"
                            >
                                <option value="All">All Priorities</option>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                className="form-input"
                                aria-label="Sort issues"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                            </select>
                        </div>

                        {filteredIssues.length === 0 ? (
                            <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                                No issues match your filters.
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table */}
                                <div className="hidden lg:block overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800">
                                                <th className="p-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    Status
                                                </th>
                                                <th className="p-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    Priority
                                                </th>
                                                <th className="p-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    Title
                                                </th>
                                                <th className="p-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    Student
                                                </th>
                                                <th className="p-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    Category
                                                </th>
                                                <th className="p-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    Date
                                                </th>
                                                <th className="p-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {filteredIssues.map((issue) => (
                                                <tr
                                                    key={issue._id}
                                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                                                >
                                                    <td className="p-3.5">
                                                        <span className={`badge ${getStatusBadgeClass(issue.status)}`}>
                                                            {issue.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-3.5">
                                                        <span className={`badge ${getPriorityBadgeClass(issue.priority)}`}>
                                                            {issue.priority}
                                                        </span>
                                                    </td>
                                                    <td className="p-3.5 font-medium text-sm text-slate-900 dark:text-slate-100 max-w-xs truncate">
                                                        {issue.title}
                                                    </td>
                                                    <td className="p-3.5">
                                                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                                            {issue.createdBy?.name}
                                                        </div>
                                                        <div className="text-xs text-slate-400 dark:text-slate-500">
                                                            {issue.createdBy?.rollNo}
                                                        </div>
                                                    </td>
                                                    <td className="p-3.5">
                                                        <span className="badge badge-low">
                                                            {issue.category}
                                                        </span>
                                                    </td>
                                                    <td className="p-3.5 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                        {formatDate(issue.createdAt)}
                                                    </td>
                                                    <td className="p-3.5 text-right">
                                                        <Link
                                                            to={`/admin/issue/${issue._id}`}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors no-underline"
                                                        >
                                                            Manage
                                                            <ArrowRight className="w-3.5 h-3.5" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Cards */}
                                <div className="space-y-3 lg:hidden">
                                    {filteredIssues.map((issue) => (
                                        <div
                                            key={issue._id}
                                            className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                                        <span className={`badge ${getStatusBadgeClass(issue.status)}`}>
                                                            {issue.status}
                                                        </span>
                                                        <span className={`badge ${getPriorityBadgeClass(issue.priority)}`}>
                                                            {issue.priority}
                                                        </span>
                                                        <span className="badge badge-low">
                                                            {issue.category}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                                                        {issue.title}
                                                    </h3>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                        {issue.createdBy?.name} · {formatDate(issue.createdAt)}
                                                    </p>
                                                </div>
                                                <Link
                                                    to={`/admin/issue/${issue._id}`}
                                                    className="shrink-0 px-3 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg no-underline"
                                                >
                                                    Manage
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                )}
            </section>
        </div>
    );
};

export default FacultyDashboard;

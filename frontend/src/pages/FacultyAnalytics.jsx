import { useEffect, useState } from "react";
import { AlertCircle, Building2, CalendarDays, CheckSquare, Users } from "lucide-react";
import api from "../services/api";
import Loader from "../components/Loader";
import AnalyticsCharts from "../components/AnalyticsCharts";

const FacultyAnalytics = () => {
    const [analytics, setAnalytics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;
        api.get("/analytics/faculty")
            .then((res) => {
                if (!isMounted) return;
                setAnalytics(res.data.analytics || null);
                setError("");
            })
            .catch((err) => {
                if (!isMounted) return;
                setError(
                    err.response?.data?.message || "Failed to load analytics."
                );
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    if (isLoading) return <Loader label="Loading analytics..." />;

    if (error) {
        return (
            <div className="page-wrapper">
                <div className="card p-6 flex items-center gap-3 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                </div>
            </div>
        );
    }

    const summary = analytics?.summary || {
        totalClubs: 0,
        totalEvents: 0,
        pendingApprovals: 0,
        totalRegistrations: 0,
    };

    const cards = [
        { label: "Total Clubs", value: summary.totalClubs, icon: Building2 },
        { label: "Total Events", value: summary.totalEvents, icon: CalendarDays },
        { label: "Pending Approvals", value: summary.pendingApprovals, icon: CheckSquare },
        { label: "Total Registrations", value: summary.totalRegistrations, icon: Users },
    ];

    return (
        <div className="page-wrapper space-y-6">
            <div>
                <h1 className="page-title">University Analytics</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Live club participation, event categories, and registration metrics.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.label} className="card p-5">
                            <div className="flex items-center justify-between gap-3 mb-2">
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
                        </div>
                    );
                })}
            </div>

            <AnalyticsCharts
                clubRegistrations={analytics?.clubRegistrations || []}
                categoryDistribution={analytics?.categoryDistribution || []}
            />
        </div>
    );
};

export default FacultyAnalytics;

import { useContext } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FolderOpen } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { getDashboardPath } from "../config/navigation";

const PortalSection = ({ title, subtitle, emptyTitle, emptyDescription, icon: Icon = FolderOpen }) => {
    const { user } = useContext(AuthContext);
    const dashboardPath = getDashboardPath(user?.role);

    return (
        <div className="page-wrapper space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="page-title">{title}</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {subtitle}
                    </p>
                </div>
                <Link
                    to={dashboardPath}
                    className="btn-secondary text-xs no-underline self-start sm:self-auto"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>
            </div>

            <div className="card p-8 sm:p-12 text-center">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6" />
                </div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                    {emptyTitle}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto">
                    {emptyDescription}
                </p>
            </div>
        </div>
    );
};

export default PortalSection;

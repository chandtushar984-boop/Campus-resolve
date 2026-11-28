
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import Loader from "../components/Loader";
import { Toast } from "../utils/toast";

const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });

const getStatusColor = (status) => {
    switch (status) {
        case "Open": return "bg-amber-100 text-amber-800";
        case "In Progress": return "bg-blue-100 text-blue-800";
        case "Resolved": return "bg-emerald-100 text-emerald-800";
        case "Rejected": return "bg-red-100 text-red-800";
        default: return "bg-slate-100 text-slate-800";
    }
};

const MyIssues = () => {
    const navigate = useNavigate();
    const [issues, setIssues] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    useEffect(() => {
        api.get("/issues/my-issues")
            .then((res) => setIssues(res.data.issues || []))
            .catch((err) => {
                const errorMessage =
                    err.response?.data?.message || "Failed to load issues.";
                setError(errorMessage);
                Toast.fire({
                    icon: "error",
                    title: errorMessage
                });
            })
            .finally(() => setIsLoading(false));
    }, []);

    const filteredIssues = issues.filter((issue) => {
        const searchText = search.toLowerCase();

        const matchesSearch =
            (issue.title || "").toLowerCase().includes(searchText) ||
            (issue.category || "").toLowerCase().includes(searchText);

        const matchesStatus =
            statusFilter === "All" || issue.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="page-wrapper">

            <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
                <div>
                    <h1 className="page-title">My Issues</h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        {filteredIssues.length} of {issues.length} issues found
                    </p>
                </div>

                <button
                    onClick={() => navigate("/student/create-issue")}
                    className="btn-primary text-sm"
                >
                    Create Issue
                </button>
            </div>

            {error && (
                <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                </div>
            )}

            {!isLoading && issues.length > 0 && (
                <div className="card p-5 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Search Issues
                            </label>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by title or category..."
                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Filter by Status
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            >
                                <option value="All">All Issues</option>
                                <option value="Open">Open</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Resolved">Resolved</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>

                    </div>

                    <button
                        onClick={() => {
                            setSearch("");
                            setStatusFilter("All");
                        }}
                        className="text-sm text-indigo-600 font-semibold mt-4 hover:text-indigo-800"
                    >
                        Clear Filters
                    </button>
                </div>
            )}

            {isLoading ? (
                <Loader />
            ) : issues.length === 0 && !error ? (
                <div className="card p-16 text-center">
                    <h3 className="font-bold text-slate-900 mb-2">
                        No issues found
                    </h3>
                    <p className="text-slate-500 text-sm mb-6">
                        You haven't raised any issues. Raise your first one!
                    </p>
                    <button
                        onClick={() => navigate("/student/create-issue")}
                        className="btn-primary text-sm mx-auto"
                    >
                        Create Issue
                    </button>
                </div>
            ) : filteredIssues.length === 0 && !error ? (
                <div className="card p-12 text-center">
                    <h3 className="font-bold text-slate-900 mb-2">
                        No matching issues
                    </h3>
                    <p className="text-slate-500 text-sm mb-4">
                        Try changing your search or status filter.
                    </p>
                    <button
                        onClick={() => {
                            setSearch("");
                            setStatusFilter("All");
                        }}
                        className="text-indigo-600 font-semibold text-sm"
                    >
                        Clear Filters
                    </button>
                </div>
            ) : (
                <>
                    <div className="data-table-container hidden lg:block">
                        <table className="data-table w-full text-left border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-4 border-b">Status</th>
                                    <th className="p-4 border-b">Title</th>
                                    <th className="p-4 border-b">Category</th>
                                    <th className="p-4 border-b">Raised On</th>
                                    <th className="p-4 border-b text-right">Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredIssues.map((issue) => (
                                    <tr
                                        key={issue._id}
                                        className="hover:bg-slate-50 border-b last:border-0 transition-colors"
                                    >
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(issue.status)}`}>
                                                {issue.status}
                                            </span>
                                        </td>

                                        <td className="p-4 font-semibold text-slate-900 max-w-xs truncate">
                                            {issue.title}
                                        </td>

                                        <td className="p-4">
                                            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                                                {issue.category}
                                            </span>
                                        </td>

                                        <td className="p-4 text-slate-500 text-sm">
                                            {formatDate(issue.createdAt)}
                                        </td>

                                        <td className="p-4 text-right">
                                            <Link
                                                to={`/student/issue/${issue._id}`}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors no-underline"
                                            >
                                                View &rarr;
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="space-y-4 lg:hidden">
                        {filteredIssues.map((issue) => (
                            <div
                                key={issue._id}
                                className="card p-5 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(issue.status)}`}>
                                                {issue.status}
                                            </span>

                                            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                                                {issue.category}
                                            </span>
                                        </div>

                                        <h3 className="font-semibold text-slate-900 text-base mb-1 truncate">
                                            {issue.title}
                                        </h3>

                                        <p className="text-xs text-slate-400">
                                            Raised on {formatDate(issue.createdAt)}
                                        </p>
                                    </div>

                                    <Link
                                        to={`/student/issue/${issue._id}`}
                                        className="shrink-0 px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors no-underline"
                                    >
                                        View
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default MyIssues;

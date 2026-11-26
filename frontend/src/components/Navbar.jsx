import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Menu, X } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { getDashboardPath } from "../config/navigation";
import ThemeToggle from "./ThemeToggle";

const Navbar = () => {
    const { user, token, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const dashboardPath = getDashboardPath(user?.role);

    const handleLogout = () => {
        setMobileOpen(false);
        logout();
        navigate("/login");
    };

    return (
        <nav className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
                <Link
                    to="/"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2.5 no-underline shrink-0"
                >
                    <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <GraduationCap className="w-4 h-4" />
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">
                        Campus<span className="text-indigo-600 dark:text-indigo-400">Resolve</span>
                    </span>
                </Link>

                {/* Desktop Right Controls */}
                <div className="hidden sm:flex items-center gap-3">
                    <ThemeToggle />
                    {token && user ? (
                        <>
                            <Link
                                to={dashboardPath}
                                className="btn-primary no-underline"
                            >
                                Go to Dashboard
                            </Link>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="btn-secondary"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/"
                                className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors no-underline"
                            >
                                Home
                            </Link>
                            <Link
                                to="/login"
                                className="btn-secondary no-underline"
                            >
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="btn-primary no-underline"
                            >
                                Register
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Controls */}
                <div className="flex sm:hidden items-center gap-2">
                    <ThemeToggle />
                    <button
                        type="button"
                        onClick={() => setMobileOpen((prev) => !prev)}
                        className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer"
                        aria-label={mobileOpen ? "Close menu" : "Open menu"}
                    >
                        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Dropdown */}
            {mobileOpen && (
                <div className="sm:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-2">
                    {token && user ? (
                        <>
                            <Link
                                to={dashboardPath}
                                onClick={() => setMobileOpen(false)}
                                className="btn-primary w-full no-underline"
                            >
                                Go to Dashboard
                            </Link>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="btn-secondary w-full"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/"
                                onClick={() => setMobileOpen(false)}
                                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 no-underline"
                            >
                                Home
                            </Link>
                            <Link
                                to="/login"
                                onClick={() => setMobileOpen(false)}
                                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 no-underline"
                            >
                                Login
                            </Link>
                            <Link
                                to="/register"
                                onClick={() => setMobileOpen(false)}
                                className="btn-primary w-full no-underline"
                            >
                                Register
                            </Link>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;

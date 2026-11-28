import { useCallback, useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { GraduationCap, LogOut, Menu, X } from "lucide-react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import {
    getDashboardPath,
    getRoleLabel,
    normalizeRole,
    ROLE_NAVIGATION,
} from "../config/navigation";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./NotificationBell";
import Footer from "./Footer";
import LogoutConfirmDialog from "./LogoutConfirmDialog";

const AppShell = ({ children }) => {
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifLoading, setNotifLoading] = useState(false);
    const [notifError, setNotifError] = useState("");

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        setNotifLoading(true);
        try {
            const res = await api.get("/notifications");
            setNotifications(res.data.notifications || []);
            setUnreadCount(res.data.unreadCount || 0);
            setNotifError("");
        } catch {
            setNotifError("Failed to load notifications.");
        } finally {
            setNotifLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications, location.pathname]);

    const handleMarkAllRead = async () => {
        try {
            await api.patch("/notifications/read-all");
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch {
            // ignore silently
        }
    };

    const handleNotificationClick = async (item) => {
        if (!item.read && item._id) {
            try {
                await api.patch(`/notifications/${item._id}/read`);
                setNotifications((prev) =>
                    prev.map((n) =>
                        n._id === item._id ? { ...n, read: true } : n
                    )
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            } catch {
                // ignore silently
            }
        }
        if (item.link) {
            navigate(item.link);
        }
    };

    const role = normalizeRole(user?.role);
    const roleLabel = getRoleLabel(user?.role);
    const navItems = ROLE_NAVIGATION[role] || ROLE_NAVIGATION.student;
    const dashboardPath = getDashboardPath(user?.role);

    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        setShowLogoutDialog(true);
    };

    const handleConfirmLogout = () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);
        setShowLogoutDialog(false);
        setSidebarOpen(false);
        logout();
        setIsLoggingOut(false);
        navigate("/login");
    };

    const isItemActive = (path) => {
        if (path === "/faculty/dashboard" && location.pathname === "/admin/dashboard") {
            return true;
        }
        return location.pathname === path;
    };

    const activeItem = navItems.find((item) => isItemActive(item.path));

    return (
        <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
            {/* Mobile Backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-out lg:static lg:translate-x-0 shrink-0 ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
                aria-label="Sidebar navigation"
            >
                {/* Sidebar Brand */}
                <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shrink-0">
                    <Link
                        to={dashboardPath}
                        className="flex items-center gap-2.5 no-underline"
                    >
                        <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                            <GraduationCap className="w-4 h-4" />
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight">
                            Campus<span className="text-indigo-600 dark:text-indigo-400">Resolve</span>
                        </span>
                    </Link>
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        aria-label="Close navigation menu"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Role Context */}
                <div className="px-4 pt-4 pb-2">
                    <div className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Portal
                        </p>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                            {roleLabel} Workspace
                        </p>
                    </div>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto" aria-label="Role navigation">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isItemActive(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium no-underline transition-colors min-h-[42px] ${
                                    active
                                        ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300"
                                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                                }`}
                            >
                                <Icon className={`w-4 h-4 shrink-0 ${active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"}`} />
                                <span className="truncate">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Sidebar User Footer */}
                <div className="p-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-3 px-2 py-2 mb-2">
                        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                                {user?.name || "User"}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {roleLabel}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer min-h-[42px]"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Column */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Navbar */}
                <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer shrink-0"
                            aria-label="Open navigation menu"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                                {activeItem?.label || `${roleLabel} Portal`}
                            </p>
                            <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 truncate">
                                University Club &amp; Event Management System
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <ThemeToggle />
                        <NotificationBell
                            notifications={notifications}
                            unreadCount={unreadCount}
                            isLoading={notifLoading}
                            error={notifError}
                            onMarkAllRead={handleMarkAllRead}
                            onNotificationClick={handleNotificationClick}
                        />
                        <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-700">
                            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                {user?.name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            <div className="hidden md:block text-left">
                                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight max-w-[140px] truncate">
                                    {user?.name}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                                    {roleLabel}
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 min-w-0">{children}</main>

                <Footer />
            </div>

            <LogoutConfirmDialog
                isOpen={showLogoutDialog}
                isBusy={isLoggingOut}
                onCancel={() => setShowLogoutDialog(false)}
                onConfirm={handleConfirmLogout}
            />
        </div>
    );
};

export default AppShell;

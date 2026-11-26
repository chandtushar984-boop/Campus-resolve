import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";

/**
 * Notification bell and dropdown shell.
 * Ready for Task 5 backend integration via props; renders empty state by default
 * with zero hardcoded notifications or unread counts.
 */
const NotificationBell = ({
    notifications = [],
    unreadCount = 0,
    isLoading = false,
    error = "",
    onMarkAllRead,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return undefined;

        const handleOutsideClick = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isOpen]);

    const displayCount = unreadCount > 99 ? "99+" : unreadCount;

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-label="Notifications"
                aria-expanded={isOpen}
                aria-haspopup="true"
                className="relative inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
            >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                        {displayCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div
                    role="region"
                    aria-label="Notifications panel"
                    className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg z-50 overflow-hidden"
                >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                Notifications
                            </h3>
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                                    {unreadCount} unread
                                </span>
                            )}
                        </div>
                        {typeof onMarkAllRead === "function" && unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={onMarkAllRead}
                                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                            >
                                <CheckCheck className="w-3.5 h-3.5" />
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {isLoading ? (
                            <div className="px-4 py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                                Loading notifications...
                            </div>
                        ) : error ? (
                            <div className="px-4 py-6 text-center text-xs text-red-600 dark:text-red-400">
                                {error}
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2.5 text-slate-400 dark:text-slate-500">
                                    <Bell className="w-4 h-4" />
                                </div>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                    No notifications yet
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Event updates, approvals, and announcements will appear here.
                                </p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                                {notifications.map((item) => (
                                    <li
                                        key={item._id || item.id}
                                        className={`px-4 py-3 text-sm ${
                                            item.read
                                                ? "bg-transparent"
                                                : "bg-indigo-50/50 dark:bg-indigo-950/20"
                                        }`}
                                    >
                                        <p className="font-medium text-slate-800 dark:text-slate-100 text-xs">
                                            {item.title}
                                        </p>
                                        {item.message && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                {item.message}
                                            </p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;

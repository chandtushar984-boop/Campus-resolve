import { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { GraduationCap, Menu, X } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { getDashboardPath } from "../config/navigation";
import ThemeToggle from "./ThemeToggle";

const PUBLIC_NAV_LINKS = [
    { label: "Home", path: "/" },
    { label: "About", sectionId: "about" },
    { label: "Clubs", path: "/clubs" },
    { label: "Events", path: "/events" },
    { label: "Campus Life", sectionId: "activities" },
    { label: "Contact", sectionId: "contact" },
];

const SCROLL_THRESHOLD = 90;

const Navbar = () => {
    const { user, token, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    const dashboardPath = getDashboardPath(user?.role);
    const isAuthenticated = Boolean(token && user);

    useEffect(() => {
        const onScroll = () => {
            const nextScrolled = window.scrollY > SCROLL_THRESHOLD;
            setIsScrolled((prev) => (prev === nextScrolled ? prev : nextScrolled));
        };

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const handleLogout = () => {
        setMobileOpen(false);
        logout();
        navigate("/login");
    };

    const handleNavItemClick = (item) => {
        setMobileOpen(false);
        if (item.path) {
            navigate(item.path);
            if (item.path === "/") {
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
            return;
        }
        if (location.pathname !== "/") {
            navigate("/");
            setTimeout(() => {
                const el = document.getElementById(item.sectionId);
                if (el) el.scrollIntoView({ behavior: "smooth" });
            }, 80);
            return;
        }
        const el = document.getElementById(item.sectionId);
        if (el) {
            el.scrollIntoView({ behavior: "smooth" });
        }
    };

    const isItemActive = (item) =>
        Boolean(item.path && location.pathname === item.path);

    return (
        <header
            className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 motion-reduce:transition-none ${
                isScrolled ? "px-3 sm:px-6 pt-3" : "px-0 pt-0"
            }`}
        >
            <nav
                aria-label="Primary navigation"
                className={`mx-auto transition-all duration-300 motion-reduce:transition-none backdrop-blur-md ${
                    isScrolled
                        ? "max-w-5xl rounded-full border border-stone-200/90 dark:border-zinc-700/80 bg-white/90 dark:bg-[#171820]/90 shadow-lg shadow-zinc-950/8 dark:shadow-black/35 px-4 sm:px-5"
                        : "w-full rounded-none border-b border-stone-200/80 dark:border-zinc-800/80 bg-[#faf9f7]/95 dark:bg-[#0e0f14]/95 px-4 sm:px-6"
                }`}
            >
                <div
                    className={`mx-auto flex items-center justify-between gap-3 transition-all duration-300 motion-reduce:transition-none ${
                        isScrolled ? "h-13" : "max-w-7xl h-16"
                    }`}
                >
                    {/* Brand */}
                    <Link
                        to="/"
                        onClick={() => {
                            setMobileOpen(false);
                            if (location.pathname === "/") {
                                window.scrollTo({ top: 0, behavior: "smooth" });
                            }
                        }}
                        className="flex items-center gap-2.5 no-underline shrink-0"
                    >
                        <span className="w-8 h-8 rounded-lg bg-[#6d5bd0] text-white flex items-center justify-center shrink-0">
                            <GraduationCap className="w-4 h-4" />
                        </span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 text-base sm:text-lg tracking-tight">
                            Campus
                            <span className="text-[#6d5bd0] dark:text-[#a78bfa]">
                                Resolve
                            </span>
                        </span>
                    </Link>

                    {/* Desktop Navigation Links */}
                    {!isAuthenticated && (
                        <div className="hidden lg:flex items-center gap-1">
                            {PUBLIC_NAV_LINKS.map((item) => {
                                const active = isItemActive(item);
                                return (
                                    <button
                                        key={item.label}
                                        type="button"
                                        onClick={() => handleNavItemClick(item)}
                                        className={`px-3 py-1.5 rounded-full text-xs xl:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#6d5bd0] ${
                                            active
                                                ? "bg-[#6d5bd0]/10 dark:bg-[#6d5bd0]/20 text-[#5b48c4] dark:text-[#c4b5fd]"
                                                : "text-zinc-600 dark:text-zinc-300 hover:text-[#6d5bd0] dark:hover:text-[#a78bfa] hover:bg-stone-100/80 dark:hover:bg-zinc-800/70"
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Desktop Right Controls */}
                    <div className="hidden lg:flex items-center gap-2.5 shrink-0">
                        <ThemeToggle />
                        {isAuthenticated ? (
                            <>
                                <Link
                                    to={dashboardPath}
                                    className="btn-primary no-underline text-xs sm:text-sm"
                                >
                                    Go to Dashboard
                                </Link>
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="btn-secondary text-xs sm:text-sm"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className={`px-3.5 py-2 rounded-full text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors no-underline ${
                                        location.pathname === "/login"
                                            ? "bg-stone-100 dark:bg-zinc-800"
                                            : ""
                                    }`}
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="inline-flex items-center justify-center min-h-[38px] px-4 py-1.5 rounded-full bg-[#6d5bd0] hover:bg-[#5b48c4] text-white text-xs sm:text-sm font-semibold transition-colors no-underline"
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile / Tablet Controls */}
                    <div className="flex lg:hidden items-center gap-2 shrink-0">
                        <ThemeToggle />
                        <button
                            type="button"
                            onClick={() => setMobileOpen((prev) => !prev)}
                            className="w-10 h-10 rounded-full border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-200 cursor-pointer"
                            aria-label={mobileOpen ? "Close menu" : "Open menu"}
                            aria-expanded={mobileOpen}
                        >
                            {mobileOpen ? (
                                <X className="w-5 h-5" />
                            ) : (
                                <Menu className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile / Tablet Drawer */}
            {mobileOpen && (
                <div
                    className={`lg:hidden mx-auto mt-2 rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white/95 dark:bg-[#171820]/95 backdrop-blur-md shadow-xl px-4 py-3 space-y-1.5 ${
                        isScrolled ? "max-w-5xl" : "max-w-7xl mx-3 sm:mx-6"
                    }`}
                >
                    {isAuthenticated ? (
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
                            {PUBLIC_NAV_LINKS.map((item) => (
                                <button
                                    key={item.label}
                                    type="button"
                                    onClick={() => handleNavItemClick(item)}
                                    className={`w-full text-left block px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer ${
                                        isItemActive(item)
                                            ? "bg-[#6d5bd0]/10 dark:bg-[#6d5bd0]/20 text-[#5b48c4] dark:text-[#c4b5fd]"
                                            : "text-zinc-700 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800"
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                            <div className="pt-2 border-t border-stone-200 dark:border-zinc-800 flex flex-col gap-2">
                                <Link
                                    to="/login"
                                    onClick={() => setMobileOpen(false)}
                                    className="btn-secondary w-full no-underline"
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
                            </div>
                        </>
                    )}
                </div>
            )}
        </header>
    );
};

export default Navbar;

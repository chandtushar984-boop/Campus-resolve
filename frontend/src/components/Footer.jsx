import { Link } from "react-router-dom";

const Footer = () => {
    return (
        <footer className="bg-white dark:bg-[#13141b] border-t border-stone-200 dark:border-zinc-800 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div className="space-y-1">
                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                        Campus
                        <span className="text-[#6d5bd0] dark:text-[#a78bfa]">
                            Resolve
                        </span>
                        <span className="font-normal text-zinc-500 dark:text-zinc-400">
                            {" "}
                            · University Club &amp; Event Portal
                        </span>
                    </span>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        © {new Date().getFullYear()} CampusResolve. All rights reserved.
                    </p>
                </div>

                <nav
                    aria-label="Footer navigation"
                    className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-zinc-600 dark:text-zinc-400"
                >
                    <Link
                        to="/"
                        className="hover:text-[#6d5bd0] dark:hover:text-[#a78bfa] no-underline transition-colors"
                    >
                        Home
                    </Link>
                    <Link
                        to="/clubs"
                        className="hover:text-[#6d5bd0] dark:hover:text-[#a78bfa] no-underline transition-colors"
                    >
                        Clubs
                    </Link>
                    <Link
                        to="/events"
                        className="hover:text-[#6d5bd0] dark:hover:text-[#a78bfa] no-underline transition-colors"
                    >
                        Events
                    </Link>
                    <Link
                        to="/login"
                        className="hover:text-[#6d5bd0] dark:hover:text-[#a78bfa] no-underline transition-colors"
                    >
                        Login
                    </Link>
                    <Link
                        to="/register"
                        className="hover:text-[#6d5bd0] dark:hover:text-[#a78bfa] no-underline transition-colors"
                    >
                        Register
                    </Link>
                </nav>
            </div>
        </footer>
    );
};

export default Footer;

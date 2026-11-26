const Footer = () => {
    return (
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Campus<span className="text-indigo-600 dark:text-indigo-400">Resolve</span>
                    <span className="font-normal text-slate-500 dark:text-slate-400"> · University Club &amp; Event Portal</span>
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    © {new Date().getFullYear()} CampusResolve. All rights reserved.
                </p>
            </div>
        </footer>
    );
};

export default Footer;

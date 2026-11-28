const Loader = ({ label = "Loading..." }) => {
    return (
        <div
            className="flex flex-col items-center justify-center min-h-64 gap-4"
            aria-label={label}
            role="status"
        >
            <div className="relative w-11 h-11">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-slate-800" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</p>
        </div>
    );
};

export default Loader;

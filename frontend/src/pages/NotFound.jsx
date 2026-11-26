import { useNavigate } from "react-router-dom";

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-[calc(100vh-130px)] flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
            <div className="text-center max-w-md">
                <div className="text-7xl sm:text-8xl font-black text-indigo-100 dark:text-indigo-950 mb-4 leading-none">
                    404
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                    Page not found
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
                    The page you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
                </p>
                <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="btn-primary text-sm px-6 py-2.5"
                >
                    Back to Home
                </button>
            </div>
        </div>
    );
};

export default NotFound;

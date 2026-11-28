import { useEffect, useRef } from "react";
import { LogOut, X } from "lucide-react";

const LogoutConfirmDialog = ({
    isOpen,
    onCancel,
    onConfirm,
    isBusy = false,
}) => {
    const cancelBtnRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return undefined;

        cancelBtnRef.current?.focus();

        const handleKeyDown = (event) => {
            if (event.key === "Escape" && !isBusy) {
                onCancel();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, isBusy, onCancel]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs"
            onClick={() => {
                if (!isBusy) onCancel();
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="logout-dialog-title"
                aria-describedby="logout-dialog-description"
                className="card w-full max-w-md p-6 shadow-2xl space-y-5"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <span className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                            <LogOut className="w-5 h-5" />
                        </span>
                        <div className="space-y-1">
                            <h2
                                id="logout-dialog-title"
                                className="text-base font-semibold text-zinc-900 dark:text-zinc-100"
                            >
                                Are you sure you want to log out?
                            </h2>
                            <p
                                id="logout-dialog-description"
                                className="text-sm text-zinc-600 dark:text-zinc-400"
                            >
                                You will need to sign in again to access your account.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isBusy}
                        aria-label="Close dialog"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-stone-100 dark:hover:bg-zinc-800 cursor-pointer shrink-0 disabled:opacity-50"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-2 border-t border-[#DCD7CE] dark:border-zinc-800">
                    <button
                        ref={cancelBtnRef}
                        type="button"
                        onClick={onCancel}
                        disabled={isBusy}
                        className="btn-secondary w-full sm:w-auto disabled:opacity-60"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isBusy}
                        className="btn-danger w-full sm:w-auto disabled:opacity-60"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LogoutConfirmDialog;

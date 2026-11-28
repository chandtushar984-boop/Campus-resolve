import { useCallback, useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
    AlertCircle,
    CheckCircle2,
    ClipboardList,
    Download,
    QrCode,
    Users,
    XCircle,
} from "lucide-react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { normalizeRole } from "../config/navigation";
import Loader from "../components/Loader";
import { Toast } from "../utils/toast";

const getAttendanceBadge = (status) => {
    if (status === "Attended") return "badge-resolved";
    if (status === "Absent") return "badge-rejected";
    return "badge-open";
};

const EventRegistrations = () => {
    const { user } = useContext(AuthContext);
    const role = normalizeRole(user?.role);
    const isFaculty = role === "faculty";
    const [searchParams, setSearchParams] = useSearchParams();

    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState(
        searchParams.get("eventId") || ""
    );
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState(true);
    const [isLoadingRegs, setIsLoadingRegs] = useState(false);
    const [error, setError] = useState("");

    const [ticketCode, setTicketCode] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [verifyFeedback, setVerifyFeedback] = useState(null);
    const [busyRegId, setBusyRegId] = useState("");
    const [exportingCsv, setExportingCsv] = useState(false);

    useEffect(() => {
        const loadEvents = async () => {
            setIsLoadingEvents(true);
            try {
                const endpoint = isFaculty
                    ? "/events/manage?status=Approved"
                    : "/events/my-club";
                const res = await api.get(endpoint);
                const list = (res.data.events || []).filter(
                    (ev) => ev.approvalStatus === "Approved"
                );
                setEvents(list);
                setSelectedEventId((prev) => {
                    if (prev && list.some((e) => e._id === prev)) return prev;
                    return list[0]?._id || "";
                });
                setError("");
            } catch (err) {
                setError(
                    err.response?.data?.message || "Failed to load events."
                );
            } finally {
                setIsLoadingEvents(false);
            }
        };
        loadEvents();
    }, [isFaculty]);

    const loadRegistrations = useCallback(async (eventId) => {
        if (!eventId) {
            setSelectedEvent(null);
            setRegistrations([]);
            return;
        }
        setIsLoadingRegs(true);
        try {
            const res = await api.get(`/events/${eventId}/registrations`);
            setSelectedEvent(res.data.event || null);
            setRegistrations(res.data.registrations || []);
            setError("");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Failed to load event registrations."
            );
        } finally {
            setIsLoadingRegs(false);
        }
    }, []);

    useEffect(() => {
        if (selectedEventId) {
            loadRegistrations(selectedEventId);
        }
    }, [selectedEventId, loadRegistrations]);

    const handleEventChange = (id) => {
        setSelectedEventId(id);
        setVerifyFeedback(null);
        setTicketCode("");
        if (id) {
            setSearchParams({ eventId: id });
        } else {
            setSearchParams({});
        }
    };

    const handleVerifyTicket = async (e) => {
        e.preventDefault();
        if (!selectedEventId || !ticketCode.trim()) return;

        setVerifying(true);
        setVerifyFeedback(null);
        try {
            const res = await api.post(
                `/events/${selectedEventId}/verify-ticket`,
                { ticketCode: ticketCode.trim() }
            );
            setVerifyFeedback({
                type: "success",
                message: res.data.message || "Ticket verified!",
                registration: res.data.registration,
            });
            setTicketCode("");
            await loadRegistrations(selectedEventId);
        } catch (err) {
            setVerifyFeedback({
                type: "error",
                message:
                    err.response?.data?.message || "Ticket verification failed.",
            });
        } finally {
            setVerifying(false);
        }
    };

    const handleMarkAttendance = async (registrationId, attendanceStatus) => {
        setBusyRegId(registrationId);
        try {
            const res = await api.patch(
                `/events/${selectedEventId}/registrations/${registrationId}/attendance`,
                { attendanceStatus }
            );
            Toast.fire({
                icon: "success",
                title: res.data.message || "Attendance updated",
            });
            await loadRegistrations(selectedEventId);
        } catch (err) {
            Toast.fire({
                icon: "error",
                title:
                    err.response?.data?.message ||
                    "Failed to update attendance.",
            });
        } finally {
            setBusyRegId("");
        }
    };

    const handleExportCsv = async () => {
        if (!selectedEventId) return;
        setExportingCsv(true);
        try {
            const res = await api.get(`/events/${selectedEventId}/export-csv`, {
                responseType: "blob",
            });
            const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute(
                "download",
                `event-${selectedEventId}-registrations.csv`
            );
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            Toast.fire({
                icon: "error",
                title:
                    err.response?.data?.message ||
                    "Failed to export registrations CSV.",
            });
        } finally {
            setExportingCsv(false);
        }
    };

    if (isLoadingEvents) return <Loader label="Loading events..." />;

    return (
        <div className="page-wrapper space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="page-title">Registrations & Ticket Verification</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Verify student QR tickets and record event attendance.
                    </p>
                </div>

                {events.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        <select
                            value={selectedEventId}
                            onChange={(e) => handleEventChange(e.target.value)}
                            className="form-input w-full sm:w-72"
                            aria-label="Select event"
                        >
                            {events.map((ev) => (
                                <option key={ev._id} value={ev._id}>
                                    {ev.title} ({ev.registeredCount || 0}/
                                    {ev.seatCapacity})
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            disabled={!selectedEventId || exportingCsv}
                            onClick={handleExportCsv}
                            className="btn-secondary text-xs shrink-0 disabled:opacity-60"
                        >
                            <Download className="w-4 h-4" />
                            {exportingCsv ? "Exporting..." : "Export CSV"}
                        </button>
                    </div>
                )}
            </div>

            {error && (
                <div className="card p-4 flex items-center gap-3 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {events.length === 0 ? (
                <div className="card p-12 text-center space-y-2">
                    <ClipboardList className="w-10 h-10 text-slate-400 mx-auto" />
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                        No approved events available
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Approved events will appear here for registration tracking and check-in.
                    </p>
                </div>
            ) : (
                <>
                    {/* Ticket Verification Card */}
                    <section className="card p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <QrCode className="w-5 h-5 text-indigo-500" />
                                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                                    Verify Ticket & Check In
                                </h2>
                            </div>
                            {selectedEvent && (
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                    <Users className="w-4 h-4 text-slate-400" />
                                    {selectedEvent.registeredCount || 0} /{" "}
                                    {selectedEvent.seatCapacity} Seats Filled
                                </span>
                            )}
                        </div>

                        <form
                            onSubmit={handleVerifyTicket}
                            className="flex flex-col sm:flex-row gap-3"
                        >
                            <input
                                type="text"
                                value={ticketCode}
                                onChange={(e) => setTicketCode(e.target.value)}
                                placeholder="Enter or scan Ticket ID (e.g. TKT-A1B2C3D4E5F6)"
                                className="form-input flex-1 font-mono"
                                aria-label="Ticket identifier"
                                required
                            />
                            <button
                                type="submit"
                                disabled={verifying || !ticketCode.trim()}
                                className="btn-primary text-xs shrink-0 disabled:opacity-60"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                {verifying ? "Verifying..." : "Verify & Check In"}
                            </button>
                        </form>

                        {verifyFeedback && (
                            <div
                                className={`p-3.5 rounded-lg border text-sm flex items-start gap-2.5 ${
                                    verifyFeedback.type === "success"
                                        ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300"
                                        : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300"
                                }`}
                            >
                                {verifyFeedback.type === "success" ? (
                                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                                ) : (
                                    <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                )}
                                <div>
                                    <p className="font-medium">
                                        {verifyFeedback.message}
                                    </p>
                                    {verifyFeedback.registration?.student && (
                                        <p className="text-xs mt-0.5 opacity-90">
                                            Student:{" "}
                                            {verifyFeedback.registration.student.name}{" "}
                                            ({verifyFeedback.registration.student.rollNo})
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Registrations Table */}
                    {isLoadingRegs ? (
                        <Loader label="Loading registrations..." />
                    ) : registrations.length === 0 ? (
                        <div className="card p-10 text-center space-y-2">
                            <Users className="w-8 h-8 text-slate-400 mx-auto" />
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                No registrations for this event yet.
                            </p>
                        </div>
                    ) : (
                        <div className="card overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500 dark:text-slate-400">
                                    <tr>
                                        <th className="py-3 px-4">Student</th>
                                        <th className="py-3 px-4">Ticket ID</th>
                                        <th className="py-3 px-4">Registration</th>
                                        <th className="py-3 px-4">Attendance</th>
                                        <th className="py-3 px-4 text-right">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {registrations.map((reg) => (
                                        <tr key={reg._id}>
                                            <td className="py-3 px-4">
                                                <p className="font-medium text-slate-900 dark:text-white">
                                                    {reg.student?.name || "Student"}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {reg.student?.rollNo} •{" "}
                                                    {reg.student?.email}
                                                </p>
                                            </td>
                                            <td className="py-3 px-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                                                {reg.ticketCode}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span
                                                    className={`badge ${
                                                        reg.status === "Registered"
                                                            ? "badge-resolved"
                                                            : "badge-rejected"
                                                    }`}
                                                >
                                                    {reg.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span
                                                    className={`badge ${getAttendanceBadge(
                                                        reg.attendanceStatus
                                                    )}`}
                                                >
                                                    {reg.attendanceStatus}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                {reg.status === "Registered" ? (
                                                    <div className="inline-flex items-center gap-2">
                                                        {reg.attendanceStatus !==
                                                            "Attended" && (
                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    busyRegId ===
                                                                    reg._id
                                                                }
                                                                onClick={() =>
                                                                    handleMarkAttendance(
                                                                        reg._id,
                                                                        "Attended"
                                                                    )
                                                                }
                                                                className="btn-primary text-xs py-1 px-2.5 disabled:opacity-60"
                                                            >
                                                                Mark Attended
                                                            </button>
                                                        )}
                                                        {reg.attendanceStatus !==
                                                            "Absent" && (
                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    busyRegId ===
                                                                    reg._id
                                                                }
                                                                onClick={() =>
                                                                    handleMarkAttendance(
                                                                        reg._id,
                                                                        "Absent"
                                                                    )
                                                                }
                                                                className="btn-secondary text-xs py-1 px-2.5 disabled:opacity-60"
                                                            >
                                                                Mark Absent
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400">
                                                        Cancelled
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default EventRegistrations;

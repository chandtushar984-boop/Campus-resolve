import {
    BarChart3,
    BookmarkCheck,
    Building2,
    CalendarDays,
    CalendarRange,
    CheckSquare,
    ClipboardList,
    Compass,
    LayoutDashboard,
    Megaphone,
    Ticket,
    Users,
} from "lucide-react";

export const normalizeRole = (role) => {
    if (!role) return "student";
    if (role === "admin" || role === "faculty") return "faculty";
    if (role === "club_head" || role === "club-head" || role === "clubHead") {
        return "club_head";
    }
    if (role === "co_head" || role === "co-head" || role === "coHead") {
        return "co_head";
    }
    return "student";
};

export const getRoleLabel = (role) => {
    const normalized = normalizeRole(role);
    if (normalized === "faculty") return "Faculty";
    if (normalized === "club_head") return "Club Head";
    if (normalized === "co_head") return "Co-Head";
    return "Student";
};

export const getDashboardPath = (role) => {
    const normalized = normalizeRole(role);
    if (normalized === "faculty") return "/faculty/dashboard";
    if (normalized === "club_head" || normalized === "co_head") {
        return "/club-head/dashboard";
    }
    return "/student/dashboard";
};

const clubOrganizerNav = [
    { label: "Dashboard", path: "/club-head/dashboard", icon: LayoutDashboard },
    { label: "My Club", path: "/club-head/my-club", icon: Building2 },
    { label: "Manage Events", path: "/club-head/events", icon: CalendarRange },
    { label: "Registrations", path: "/club-head/registrations", icon: ClipboardList },
    { label: "Announcements", path: "/club-head/announcements", icon: Megaphone },
];

export const ROLE_NAVIGATION = {
    student: [
        { label: "Dashboard", path: "/student/dashboard", icon: LayoutDashboard },
        { label: "Explore Events", path: "/student/events", icon: Compass },
        { label: "Clubs", path: "/student/clubs", icon: Users },
        { label: "My Clubs", path: "/student/my-clubs", icon: BookmarkCheck },
        { label: "My Tickets", path: "/student/my-tickets", icon: Ticket },
    ],
    club_head: clubOrganizerNav,
    co_head: clubOrganizerNav,
    faculty: [
        { label: "Dashboard", path: "/faculty/dashboard", icon: LayoutDashboard },
        { label: "Event Approvals", path: "/faculty/approvals", icon: CheckSquare },
        { label: "Clubs & Organizers", path: "/faculty/clubs", icon: Building2 },
        { label: "Events", path: "/faculty/events", icon: CalendarDays },
        { label: "Registrations", path: "/faculty/registrations", icon: ClipboardList },
        { label: "Analytics", path: "/faculty/analytics", icon: BarChart3 },
    ],
};

import { BrowserRouter, Routes, Route } from "react-router-dom";
import {
    BarChart3,
    CalendarDays,
    CalendarRange,
    CheckSquare,
    ClipboardList,
    Compass,
    Ticket,
} from "lucide-react";

import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import ClubHeadDashboard from "./pages/ClubHeadDashboard.jsx";
import FacultyDashboard from "./pages/FacultyDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import ClubsDirectory from "./pages/ClubsDirectory.jsx";
import ClubDetails from "./pages/ClubDetails.jsx";
import MyClubs from "./pages/MyClubs.jsx";
import ClubAnnouncements from "./pages/ClubAnnouncements.jsx";
import PortalSection from "./pages/PortalSection.jsx";
import CreateIssue from "./pages/CreateIssue.jsx";
import MyIssues from "./pages/MyIssues.jsx";
import IssueDetails from "./pages/IssueDetails.jsx";
import ManageIssue from "./pages/ManageIssue.jsx";
import NotFound from "./pages/NotFound.jsx";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AppShell from "./components/AppShell.jsx";
import Footer from "./components/Footer.jsx";
import Navbar from "./components/Navbar.jsx";

const PublicLayout = ({ children }) => (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
    </div>
);

const ProtectedShell = ({ allowedRole, allowedRoles, children }) => (
    <ProtectedRoute allowedRole={allowedRole} allowedRoles={allowedRoles}>
        <AppShell>{children}</AppShell>
    </ProtectedRoute>
);

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes */}
                <Route
                    path="/"
                    element={
                        <PublicLayout>
                            <Landing />
                        </PublicLayout>
                    }
                />
                <Route
                    path="/login"
                    element={
                        <PublicLayout>
                            <Login />
                        </PublicLayout>
                    }
                />
                <Route
                    path="/register"
                    element={
                        <PublicLayout>
                            <Register />
                        </PublicLayout>
                    }
                />

                {/* Student Routes */}
                <Route
                    path="/student/dashboard"
                    element={
                        <ProtectedShell allowedRole="student">
                            <StudentDashboard />
                        </ProtectedShell>
                    }
                />
                <Route
                    path="/student/events"
                    element={
                        <ProtectedShell allowedRole="student">
                            <PortalSection
                                title="Explore Events"
                                subtitle="Discover upcoming workshops, seminars, fests, and club activities."
                                emptyTitle="No published events yet"
                                emptyDescription="Approved campus events will appear here once clubs publish them."
                                icon={Compass}
                            />
                        </ProtectedShell>
                    }
                />
                <Route
                    path="/student/clubs"
                    element={
                        <ProtectedShell allowedRole="student">
                            <ClubsDirectory />
                        </ProtectedShell>
                    }
                />
                <Route
                    path="/student/clubs/:id"
                    element={
                        <ProtectedShell allowedRole="student">
                            <ClubDetails />
                        </ProtectedShell>
                    }
                />
                <Route
                    path="/student/my-clubs"
                    element={
                        <ProtectedShell allowedRole="student">
                            <MyClubs />
                        </ProtectedShell>
                    }
                />
                <Route
                    path="/student/my-tickets"
                    element={
                        <ProtectedShell allowedRole="student">
                            <PortalSection
                                title="My Tickets"
                                subtitle="View your event registrations and entry passes."
                                emptyTitle="No event tickets yet"
                                emptyDescription="Tickets for events you register for will appear here."
                                icon={Ticket}
                            />
                        </ProtectedShell>
                    }
                />
                <Route
                    path="/student/create-issue"
                    element={
                        <ProtectedShell allowedRole="student">
                            <CreateIssue />
                        </ProtectedShell>
                    }
                />
                <Route
                    path="/student/my-issues"
                    element={
                        <ProtectedShell allowedRole="student">
                            <MyIssues />
                        </ProtectedShell>
                    }
                />
                <Route
                    path="/student/issue/:id"
                    element={
                        <ProtectedShell allowedRole="student">
                            <IssueDetails />
                        </ProtectedShell>
                    }
                />

                {/* Club Head Routes */}
                <Route
                    path="/club-head/dashboard"
                    element={
                        <ProtectedShell allowedRole="club_head">
                            <ClubHeadDashboard />
                        </ProtectedShell>
                    }
                />
                <Route
                    path="/club-head/my-club"
                    element={
                        <ProtectedShell allowedRole="club_head">
                            <ClubDetails />
                        </ProtectedShell>
                    }
                />
                <Route
                    path="/club-head/events"
                    element={
                        <ProtectedShell allowedRole="club_head">
                            <PortalSection
                                title="Manage Events"
                                subtitle="Create, schedule, and track approval status of your club events."
                                emptyTitle="No club events yet"
                                emptyDescription="Events organized by your club will be managed from this page."
                                icon={CalendarRange}
                            />
                        </ProtectedShell>
                    }
                />
                <Route
                    path="/club-head/registrations"
                    element={
                        <ProtectedShell allowedRole="club_head">
                            <PortalSection
                                title="Registrations"
                                subtitle="View student registrations and attendance for your club events."
                                emptyTitle="No registrations yet"
                                emptyDescription="Student registrations for your club events will appear here."
                                icon={ClipboardList}
                            />
                        </ProtectedShell>
                    }
                />
                <Route
                    path="/club-head/announcements"
                    element={
                        <ProtectedShell allowedRole="club_head">
                            <ClubAnnouncements />
                        </ProtectedShell>
                    }
                />

                {/* Faculty & Admin Routes */}
                <Route
                    path="/faculty/dashboard"
                    element={
                        <ProtectedShell allowedRoles={["faculty", "admin"]}>
                            <FacultyDashboard />
                        </ProtectedShell>
                    }
                />
                <Route
                    path="/faculty/approvals"
                    element={
                        <ProtectedShell allowedRoles={["faculty", "admin"]}>
                            <PortalSection
                                title="Event Approvals"
                                subtitle="Review and approve event proposals submitted by club heads."
                                emptyTitle="No pending event approvals"
                                emptyDescription="Event proposals awaiting faculty review will appear here."
                                icon={CheckSquare}
                            />
                        </ProtectedShell>
                    }
                />
                <Route
                    path="/faculty/clubs"
                    element={
                        <ProtectedShell allowedRoles={["faculty", "admin"]}>
                            <ClubsDirectory />
                        </ProtectedShell>
                    }
                />
                <Route
                    path="/faculty/clubs/:id"
                    element={
                        <ProtectedShell allowedRoles={["faculty", "admin"]}>
                            <ClubDetails />
                        </ProtectedShell>
                    }
                />
                <Route
                    path="/faculty/events"
                    element={
                        <ProtectedShell allowedRoles={["faculty", "admin"]}>
                            <PortalSection
                                title="Events"
                                subtitle="Monitor all scheduled, ongoing, and completed campus events."
                                emptyTitle="No campus events scheduled"
                                emptyDescription="Approved and scheduled university events will appear here."
                                icon={CalendarDays}
                            />
                        </ProtectedShell>
                    }
                />
                <Route
                    path="/faculty/analytics"
                    element={
                        <ProtectedShell allowedRoles={["faculty", "admin"]}>
                            <PortalSection
                                title="Analytics"
                                subtitle="Track university-wide club participation and event metrics."
                                emptyTitle="Analytics data not available yet"
                                emptyDescription="Participation metrics and event trends will appear here once event data is recorded."
                                icon={BarChart3}
                            />
                        </ProtectedShell>
                    }
                />
                <Route
                    path="/admin/dashboard"
                    element={
                        <ProtectedShell allowedRoles={["faculty", "admin"]}>
                            <AdminDashboard />
                        </ProtectedShell>
                    }
                />
                <Route
                    path="/admin/issue/:id"
                    element={
                        <ProtectedShell allowedRoles={["faculty", "admin"]}>
                            <ManageIssue />
                        </ProtectedShell>
                    }
                />

                <Route
                    path="*"
                    element={
                        <PublicLayout>
                            <NotFound />
                        </PublicLayout>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;

import { BrowserRouter, Routes, Route } from "react-router-dom";

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
import ExploreEvents from "./pages/ExploreEvents.jsx";
import EventDetails from "./pages/EventDetails.jsx";
import ManageEvents from "./pages/ManageEvents.jsx";
import EventApprovals from "./pages/EventApprovals.jsx";
import MyTickets from "./pages/MyTickets.jsx";
import EventRegistrations from "./pages/EventRegistrations.jsx";
import FacultyAnalytics from "./pages/FacultyAnalytics.jsx";
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
                            <ExploreEvents />
                        </ProtectedShell>
                    }
                />
                <Route
                    path="/events/:id"
                    element={
                        <ProtectedShell allowedRoles={["student", "club_head", "co_head", "faculty", "admin"]}>
                            <EventDetails />
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
                            <MyTickets />
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

                {/* Club Head & Co-Head Routes */}
                <Route
                    path="/club-head/dashboard"
                    element={
                        <ProtectedShell allowedRoles={["club_head", "co_head"]}>
                            <ClubHeadDashboard />
                        </ProtectedShell>
                    }
                />
                <Route
                    path="/club-head/my-club"
                    element={
                        <ProtectedShell allowedRoles={["club_head", "co_head"]}>
                            <ClubDetails />
                        </ProtectedShell>
                    }
                />
                <Route
                    path="/club-head/events"
                    element={
                        <ProtectedShell allowedRoles={["club_head", "co_head"]}>
                            <ManageEvents />
                        </ProtectedShell>
                    }
                />
                <Route
                    path="/club-head/registrations"
                    element={
                        <ProtectedShell allowedRoles={["club_head", "co_head"]}>
                            <EventRegistrations />
                        </ProtectedShell>
                    }
                />
                <Route
                    path="/club-head/announcements"
                    element={
                        <ProtectedShell allowedRoles={["club_head", "co_head"]}>
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
                            <EventApprovals />
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
                            <ExploreEvents />
                        </ProtectedShell>
                    }
                />
                <Route
                    path="/faculty/registrations"
                    element={
                        <ProtectedShell allowedRoles={["faculty", "admin"]}>
                            <EventRegistrations />
                        </ProtectedShell>
                    }
                />
                <Route
                    path="/faculty/analytics"
                    element={
                        <ProtectedShell allowedRoles={["faculty", "admin"]}>
                            <FacultyAnalytics />
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

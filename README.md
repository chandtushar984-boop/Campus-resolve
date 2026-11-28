# Campus Resolve

A full-stack MERN University Club, Event, Ticketing, and Campus Grievance Management System.

## Features

**Student**
- Register and log in with university email validation and role-based JWT authentication
- Explore approved campus events with live seat counts (`registered / capacity`) and ratings
- Register for events (atomic seat reservation, duplicate prevention) and cancel registrations before event start
- View **My Tickets** with unique QR codes (`qrcode.react`) encoding only the opaque ticket identifier
- Browse university clubs, join/leave clubs, and view club announcements
- Submit post-event reviews and ratings (restricted to attended students after the event ends)
- Receive in-app notifications (navbar bell) and email alerts (when SMTP is configured)
- Raise and track campus issues/grievances

**Club Head & Co-Head**
- Manage assigned club profile and post pinned/regular club announcements
- Create, edit, and cancel club events with poster image uploads
- Verify student QR tickets, prevent duplicate check-ins, and record attendance (`Registered`, `Attended`, `Absent`)
- Export event registrations to CSV (with formula-injection protection)
- View club analytics (member count, total/upcoming/pending events, registrations, and ratings)

**Faculty & Admin**
- Create clubs and assign Club Heads and Co-Heads
- Approve or reject event proposals with automatic venue/time conflict detection and rejection reasons
- View university-wide analytics dashboard with **Recharts** visualizations (club-wise event registrations bar chart and category-wise event distribution pie chart)
- Manage campus issues/grievances

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, React Router, Axios, Lucide Icons, `qrcode.react`, `recharts`, SweetAlert2
- **Backend**: Node.js, Express 5, Mongoose, MongoDB, JWT, bcrypt, Nodemailer
- **Testing & Linting**: Node built-in test runner (`node --test`), `oxlint`

## Project Structure

```text
Campus-resolve/
├── backend/
│   ├── server.js
│   ├── scripts/
│   │   ├── createAdmin.js
│   │   └── seedDemoData.js
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── analytics.controller.js
│   │   │   ├── auth.controller.js
│   │   │   ├── club.controller.js
│   │   │   ├── event.controller.js
│   │   │   ├── issue.controller.js
│   │   │   ├── notification.controller.js
│   │   │   ├── registration.controller.js
│   │   │   └── review.controller.js
│   │   ├── database/
│   │   │   └── db.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   └── role.middleware.js
│   │   ├── models/
│   │   │   ├── club.model.js
│   │   │   ├── clubAnnouncement.model.js
│   │   │   ├── clubMembership.model.js
│   │   │   ├── event.model.js
│   │   │   ├── eventRegistration.model.js
│   │   │   ├── eventReview.model.js
│   │   │   ├── issue.model.js
│   │   │   ├── notification.model.js
│   │   │   └── user.model.js
│   │   ├── routes/
│   │   │   ├── analytics.routes.js
│   │   │   ├── auth.routes.js
│   │   │   ├── club.routes.js
│   │   │   ├── event.routes.js
│   │   │   ├── issue.routes.js
│   │   │   ├── notification.routes.js
│   │   │   └── registration.routes.js
│   │   └── services/
│   │       ├── email.service.js
│   │       ├── email.templates.js
│   │       └── notification.service.js
│   └── tests/
│       ├── task2.test.js
│       ├── task3.test.js
│       ├── task4.test.js
│       ├── task5.test.js
│       └── task6.test.js
└── frontend/
    ├── index.html
    └── src/
        ├── components/
        │   ├── AnalyticsCharts.jsx
        │   ├── AppShell.jsx
        │   ├── Footer.jsx
        │   ├── Loader.jsx
        │   ├── Navbar.jsx
        │   ├── NotificationBell.jsx
        │   ├── ProtectedRoute.jsx
        │   └── ThemeToggle.jsx
        ├── config/
        │   └── navigation.js
        ├── context/
        │   ├── AuthContext.jsx
        │   └── ThemeContext.jsx
        ├── pages/
        │   ├── AdminDashboard.jsx
        │   ├── ClubAnnouncements.jsx
        │   ├── ClubDetails.jsx
        │   ├── ClubHeadDashboard.jsx
        │   ├── ClubsDirectory.jsx
        │   ├── CreateIssue.jsx
        │   ├── EventApprovals.jsx
        │   ├── EventDetails.jsx
        │   ├── EventRegistrations.jsx
        │   ├── ExploreEvents.jsx
        │   ├── FacultyAnalytics.jsx
        │   ├── FacultyDashboard.jsx
        │   ├── IssueDetails.jsx
        │   ├── Landing.jsx
        │   ├── Login.jsx
        │   ├── ManageEvents.jsx
        │   ├── ManageIssue.jsx
        │   ├── MyClubs.jsx
        │   ├── MyIssues.jsx
        │   ├── MyTickets.jsx
        │   ├── NotFound.jsx
        │   ├── Register.jsx
        │   └── StudentDashboard.jsx
        ├── services/
        │   └── api.js
        └── App.jsx
```

## Installation

```bash
git clone https://github.com/chandtushar984-boop/Campus-resolve.git
cd Campus-resolve

cd backend && npm install
cd ../frontend && npm install
```

## Environment Variables

Create `backend/.env`:

```env
MONGO_URI=your_mongodb_connection_string
PORT=4000
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173

# Optional Demo Mode
ENABLE_DEMO_LOGIN=true

# Optional SMTP Configuration (Nodemailer)
# If omitted, the app runs normally and reports email as not configured.
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SMTP_FROM=CampusResolve <no-reply@example.com>
SMTP_SECURE=false
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:4000/api
```

## Running the Application

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend (in a separate terminal):

```bash
cd frontend
npm run dev
```

## Demo Accounts & Seeding

Seed demo accounts (Student, Club Head, Co-Head, Faculty), sample clubs, announcements, and events:

```bash
cd backend
npm run seed-demo
```

Create an admin account:

```bash
cd backend
npm run create-admin
```

## Testing & Verification

Run all backend unit and regression tests:

```bash
node --test backend/tests/task2.test.js backend/tests/task3.test.js backend/tests/task4.test.js backend/tests/task5.test.js backend/tests/task6.test.js
```

Run frontend lint and production build:

```bash
cd frontend
npm run lint
npm run build
```

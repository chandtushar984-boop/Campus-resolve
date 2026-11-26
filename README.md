# Campus Resolve

A MERN stack based grievance management system for colleges. Students can register, log in, raise complaints, and track their status. Admins can review complaints, assign departments, set priorities, update status, and add remarks.

## Features

**Student**
- Register and login
- Create a complaint
- View all complaints raised by them
- Edit or delete a complaint (only allowed while status is `Open`)

**Admin**
- Login with admin credentials
- View all complaints raised by students
- Update complaint status
- Update priority
- Assign department
- Add remarks

**General**
- JWT based authentication
- Role based authorization (student / admin)
- Protected routes on frontend and backend

## Tech Stack

**Frontend**
- React
- Vite
- React Router
- Axios
- Context API (for auth state)

**Backend**
- Node.js
- Express.js
- JWT
- bcrypt
- CORS
- dotenv

**Database**
- MongoDB Atlas
- Mongoose

**Deployment**
- Frontend: Vercel
- Backend: Render

## Project Structure

```
campus-resolve/
├── backend/
│   ├── server.js
│   ├── scripts/
│   │   └── createAdmin.js
│   └── src/
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   └── issue.controller.js
│       ├── database/
│       │   └── db.js
│       ├── middleware/
│       │   ├── auth.middleware.js
│       │   └── role.middleware.js
│       ├── models/
│       │   ├── user.model.js
│       │   └── issue.model.js
│       └── routes/
│           ├── auth.routes.js
│           └── issue.routes.js
│
└── frontend/
    ├── index.html
    └── src/
        ├── components/
        │   ├── Navbar.jsx
        │   ├── Footer.jsx
        │   ├── Loader.jsx
        │   └── ProtectedRoute.jsx
        ├── context/
        │   └── AuthContext.jsx
        ├── pages/
        │   ├── Landing.jsx
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── StudentDashboard.jsx
        │   ├── CreateIssue.jsx
        │   ├── MyIssues.jsx
        │   ├── IssueDetails.jsx
        │   ├── AdminDashboard.jsx
        │   ├── ManageIssue.jsx
        │   └── NotFound.jsx
        ├── services/
        │   └── api.js
        └── App.jsx
```

## Installation

Clone the repo:

```bash
git clone https://github.com/<your-username>/campus-resolve.git
cd campus-resolve
```

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

## Environment Variables

Create a `.env` file inside `backend/`:

```
MONGO_URI=your_mongodb_connection_string
PORT=4000
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
```

Create a `.env` file inside `frontend/`:

```
VITE_API_URL=http://localhost:4000/api
```

## Running the Project

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

Frontend runs on `http://localhost:5173` and the backend on `http://localhost:4000` by default.

To create an admin user, run this from the `backend` folder:

```bash
npm run create-admin
```

## Future Improvements

- Email/SMS notifications on status updates
- File/image upload support for complaints
- Admin analytics dashboard
- In-app chat/comments between student and admin
- Pagination and search/filter on complaint lists

# Campus-resolve

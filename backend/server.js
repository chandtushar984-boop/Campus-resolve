import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import connectDB from "./src/database/db.js";
import authRoutes from "./src/routes/auth.routes.js";
import issueRoutes from "./src/routes/issue.routes.js";
import clubRoutes from "./src/routes/club.routes.js";
import eventRoutes from "./src/routes/event.routes.js";
import registrationRoutes from "./src/routes/registration.routes.js";
import notificationRoutes from "./src/routes/notification.routes.js";
import analyticsRoutes from "./src/routes/analytics.routes.js";

dotenv.config();

const app = express();

app.use(express.json({ limit: "4mb" }));
app.use(
    cors({
        origin: [process.env.FRONTEND_URL, "http://localhost:5173"],
        credentials: true,
    })
);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);

const port = process.env.PORT || 4000;

connectDB();

app.listen(port, () => {
    console.log(`Server has started on port: ${port}`);
});

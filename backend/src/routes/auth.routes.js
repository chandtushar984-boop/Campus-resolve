import express from "express";
import {
    demoLogin,
    getMe,
    listAssignableStudents,
    loginUser,
    registerUser,
} from "../controllers/auth.controller.js";
import { auth } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/demo-login", demoLogin);
router.get("/me", auth, getMe);
router.get("/students", auth, authorizeRoles("faculty", "admin"), listAssignableStudents);

export default router;

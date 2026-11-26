import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const STUDENT_EMAIL_REGEX = /^\d{10}@krmu\.edu\.in$/;
const ROLL_NO_REGEX = /^\d{10}$/;
const DEMO_ROLES = ["student", "club_head", "faculty"];

const sanitizeUser = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    rollNo: user.rollNo,
    course: user.course,
    semester: user.semester,
    managedClub: user.managedClub || null,
    isDemo: Boolean(user.isDemo),
});

const signUserToken = (user) =>
    jwt.sign(
        {
            userId: user._id,
            role: user.role,
            managedClub: user.managedClub?._id || user.managedClub || null,
        },
        process.env.JWT_SECRET,
        { expiresIn: "3d" }
    );

const registerUser = async (req, res) => {
    try {
        const { name, email, password, rollNo, course, semester } = req.body;

        if (!name || !email || !password || !rollNo || !course || !semester) {
            return res.status(400).json({
                success: false,
                message: "All fields are required!",
            });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const normalizedRollNo = String(rollNo).trim();

        if (!ROLL_NO_REGEX.test(normalizedRollNo)) {
            return res.status(400).json({
                success: false,
                message: "Roll number must be exactly 10 digits.",
            });
        }

        if (!STUDENT_EMAIL_REGEX.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Email must use your university address (10digitrollnumber@krmu.edu.in).",
            });
        }

        if (normalizedEmail.split("@")[0] !== normalizedRollNo) {
            return res.status(400).json({
                success: false,
                message: "Email roll number must match your Roll Number.",
            });
        }

        if (String(password).length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters.",
            });
        }

        const existingUser = await User.findOne({
            $or: [{ email: normalizedEmail }, { rollNo: normalizedRollNo }],
        });

        if (existingUser) {
            if (existingUser.email === normalizedEmail) {
                return res.status(409).json({
                    success: false,
                    message: "Email already exists",
                });
            }
            return res.status(409).json({
                success: false,
                message: "Roll Number already exists",
            });
        }

        const hashPassword = await bcrypt.hash(password, 10);

        // Public registration always creates a student account
        await User.create({
            name: String(name).trim(),
            email: normalizedEmail,
            password: hashPassword,
            rollNo: normalizedRollNo,
            course: String(course).trim(),
            semester: String(semester).trim(),
            role: "student",
        });

        return res.status(201).json({
            success: true,
            message: "User registered successfully...",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error..",
        });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and Password are required",
            });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail }).populate(
            "managedClub",
            "name category logo"
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const token = signUserToken(user);

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: sanitizeUser(user),
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

const demoLogin = async (req, res) => {
    try {
        const isProd = process.env.NODE_ENV === "production";
        const demoEnabled = isProd
            ? process.env.ENABLE_DEMO_LOGIN === "true"
            : process.env.ENABLE_DEMO_LOGIN !== "false";

        if (!demoEnabled) {
            return res.status(403).json({
                success: false,
                message: "Demo login is disabled in this environment.",
            });
        }

        const { role } = req.body;
        if (!DEMO_ROLES.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid demo role requested.",
            });
        }

        const demoUser = await User.findOne({ role, isDemo: true }).populate(
            "managedClub",
            "name category logo"
        );

        if (!demoUser) {
            return res.status(404).json({
                success: false,
                message: "Demo account not seeded. Run the demo seed script first.",
            });
        }

        const token = signUserToken(demoUser);

        return res.status(200).json({
            success: true,
            message: "Demo login successful",
            token,
            user: sanitizeUser(demoUser),
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select("-password")
            .populate("managedClub", "name category logo");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            user: sanitizeUser(user),
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

const listAssignableStudents = async (req, res) => {
    try {
        const students = await User.find({
            role: { $in: ["student", "club_head"] },
        })
            .select("name email rollNo course semester role managedClub")
            .sort({ name: 1 });

        return res.status(200).json({
            success: true,
            students,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to load students",
        });
    }
};

export {
    registerUser,
    loginUser,
    demoLogin,
    getMe,
    listAssignableStudents,
};

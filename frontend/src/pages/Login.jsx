import { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Shield, UserCheck, Users } from "lucide-react";
import api from "../services/api.js";
import { AuthContext } from "../context/AuthContext.jsx";
import { getDashboardPath } from "../config/navigation.js";
import { Toast } from "../utils/toast.js";

const STUDENT_EMAIL_REGEX = /^\d{10}@krmu\.edu\.in$/;
const ADMIN_EMAIL = "admin@krmu.edu.in";

const DEMO_OPTIONS = [
    { role: "student", label: "Demo Student", icon: Users },
    { role: "club_head", label: "Demo Club Head", icon: UserCheck },
    { role: "co_head", label: "Demo Co-Head", icon: UserCheck },
    { role: "faculty", label: "Demo Faculty", icon: Shield },
];

const Login = () => {
    const navigate = useNavigate();
    const { user, token, setUser, setToken } = useContext(AuthContext);

    const [formData, setFormData] = useState({ email: "", password: "" });
    const [fieldErrors, setFieldErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [demoLoadingRole, setDemoLoadingRole] = useState("");

    useEffect(() => {
        if (token && user) {
            navigate(getDashboardPath(user.role), { replace: true });
        }
    }, [token, user, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setFieldErrors({ ...fieldErrors, [e.target.name]: "" });
    };

    const validate = () => {
        const errors = {};
        const email = formData.email.trim();

        if (email !== ADMIN_EMAIL && !STUDENT_EMAIL_REGEX.test(email) && !email.endsWith("@krmu.edu.in")) {
            errors.email =
                "Enter your university email (@krmu.edu.in).";
        }

        if (!formData.password) {
            errors.password = "Password is required.";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const completeLogin = (nextToken, nextUser, message) => {
        localStorage.setItem("token", nextToken);
        localStorage.setItem("user", JSON.stringify(nextUser));
        setToken(nextToken);
        setUser(nextUser);

        Toast.fire({
            icon: "success",
            title: message || "Login successful",
        });

        navigate(getDashboardPath(nextUser.role));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);
        try {
            const response = await api.post("/auth/login", formData);
            completeLogin(
                response.data.token,
                response.data.user,
                "Login successful"
            );
        } catch (err) {
            Toast.fire({
                icon: "error",
                title:
                    err.response?.data?.message ||
                    "Login failed. Check your credentials.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDemoLogin = async (role) => {
        setDemoLoadingRole(role);
        try {
            const response = await api.post("/auth/demo-login", { role });
            completeLogin(
                response.data.token,
                response.data.user,
                `Signed in as ${response.data.user.name}`
            );
        } catch (err) {
            Toast.fire({
                icon: "error",
                title:
                    err.response?.data?.message ||
                    "Demo login is unavailable right now.",
            });
        } finally {
            setDemoLoadingRole("");
        }
    };

    return (
        <div className="min-h-[calc(100vh-130px)] flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 py-10">
            <div className="w-full max-w-md">
                <div className="text-center mb-7">
                    <div className="inline-flex w-12 h-12 rounded-xl bg-indigo-600 items-center justify-center shadow-sm mb-4 text-white">
                        <GraduationCap className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Welcome back
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Sign in to your CampusResolve account
                    </p>
                </div>

                <div className="card p-6 sm:p-8 space-y-6">
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-4"
                        noValidate
                    >
                        <div>
                            <label htmlFor="login-email" className="form-label">
                                Email Address
                            </label>
                            <input
                                id="login-email"
                                type="email"
                                name="email"
                                placeholder="2301010001@krmu.edu.in"
                                value={formData.email}
                                onChange={handleChange}
                                className="form-input"
                                required
                            />
                            {fieldErrors.email && (
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                    {fieldErrors.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="login-password" className="form-label">
                                Password
                            </label>
                            <input
                                id="login-password"
                                type="password"
                                name="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                className="form-input"
                                required
                            />
                            {fieldErrors.password && (
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                    {fieldErrors.password}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || Boolean(demoLoadingRole)}
                            className="btn-primary w-full py-2.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>

                    {/* Demo Login */}
                    <div className="pt-5 border-t border-slate-200 dark:border-slate-800">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center mb-3">
                            Quick Demo Access
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {DEMO_OPTIONS.map((item) => {
                                const Icon = item.icon;
                                const busy = demoLoadingRole === item.role;
                                return (
                                    <button
                                        key={item.role}
                                        type="button"
                                        onClick={() => handleDemoLogin(item.role)}
                                        disabled={isLoading || Boolean(demoLoadingRole)}
                                        className="btn-secondary text-xs px-2.5 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        <Icon className="w-3.5 h-3.5 shrink-0" />
                                        <span className="truncate">
                                            {busy ? "Signing in..." : item.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <p className="text-center mt-5 text-sm text-slate-500 dark:text-slate-400">
                    Don&apos;t have an account?{" "}
                    <Link
                        to="/register"
                        className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                        Register here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;

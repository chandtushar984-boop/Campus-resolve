import { createContext, useCallback, useState } from "react";
import api from "../services/api";

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const storedUser = localStorage.getItem("user");
            return storedUser ? JSON.parse(storedUser) : null;
        } catch {
            localStorage.removeItem("user");
            return null;
        }
    });

    const [token, setToken] = useState(
        () => localStorage.getItem("token") || ""
    );

    const logout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken("");
        setUser(null);
    }, []);

    const refreshUser = useCallback(async () => {
        const activeToken = localStorage.getItem("token");
        if (!activeToken) return null;
        const res = await api.get("/auth/me");
        if (res.data?.user) {
            localStorage.setItem("user", JSON.stringify(res.data.user));
            setUser(res.data.user);
            return res.data.user;
        }
        return null;
    }, []);

    return (
        <AuthContext.Provider
            value={{ user, setUser, token, setToken, logout, refreshUser }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;

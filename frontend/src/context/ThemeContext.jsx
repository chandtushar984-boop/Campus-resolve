import { useEffect, useState } from "react";
import { ThemeContext } from "./themeContext";

const STORAGE_KEY = "theme";

const getSystemTheme = () => {
    if (typeof window !== "undefined" && window.matchMedia) {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    }
    return "light";
};

const getInitialTheme = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === "light" || saved === "dark") {
            return saved;
        }
    } catch {
        // Ignore storage access errors
    }
    return getSystemTheme();
};

const applyThemeToDocument = (theme) => {
    const root = document.documentElement;
    if (theme === "dark") {
        root.classList.add("dark");
    } else {
        root.classList.remove("dark");
    }
    root.style.colorScheme = theme;
};

const ThemeProvider = ({ children }) => {
    const [theme, setThemeState] = useState(getInitialTheme);

    useEffect(() => {
        applyThemeToDocument(theme);
    }, [theme]);

    useEffect(() => {
        if (!window.matchMedia) return undefined;
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

        const handleSystemChange = (event) => {
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved === "light" || saved === "dark") {
                    return;
                }
            } catch {
                // Ignore storage errors
            }
            setThemeState(event.matches ? "dark" : "light");
        };

        mediaQuery.addEventListener("change", handleSystemChange);
        return () => mediaQuery.removeEventListener("change", handleSystemChange);
    }, []);

    const setTheme = (nextTheme) => {
        const resolved = nextTheme === "dark" ? "dark" : "light";
        try {
            localStorage.setItem(STORAGE_KEY, resolved);
        } catch {
            // Ignore storage errors
        }
        setThemeState(resolved);
    };

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeProvider;

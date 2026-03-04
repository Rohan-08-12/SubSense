"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "https://subsense.onrender.com/api";

interface User {
    id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    loading: boolean;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem("token");
        if (saved) {
            setToken(saved);
            fetchUser(saved);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUser = async (tkn: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${tkn}` },
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data.data || data.user || data);
            } else {
                doLogout();
            }
        } catch {
            doLogout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || data.message || "Login failed");
        const tkn = data.data?.token || data.token;
        const usr = data.data?.user || data.user;
        localStorage.setItem("token", tkn);
        setToken(tkn);
        setUser(usr);
    };

    const register = async (name: string, email: string, password: string) => {
        const parts = name.trim().split(" ");
        const firstName = parts[0] || "";
        const lastName = parts.slice(1).join(" ") || "";

        const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ firstName, lastName, email, password }),
        });
        const data = await res.json();
        if (!res.ok)
            throw new Error(data.error || data.message || "Registration failed");
        const tkn = data.data?.token || data.token;
        const usr = data.data?.user || data.user;
        localStorage.setItem("token", tkn);
        setToken(tkn);
        setUser(usr);
    };

    const doLogout = () => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
    };

    const logout = () => {
        doLogout();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                login,
                register,
                logout,
                loading,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}

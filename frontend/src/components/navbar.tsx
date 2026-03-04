"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useTheme } from "@/components/theme-provider";

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { isAuthenticated, user, logout, loading } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    const linkClass = (href: string) =>
        `text-sm font-medium transition-colors hover:text-purple-500 ${pathname === href
            ? "text-purple-600 dark:text-purple-400"
            : "text-gray-600 dark:text-gray-300"
        }`;

    return (
        <nav className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            SubSense
                        </span>
                    </Link>

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                        {/* Theme toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                        >
                            <span className="text-lg">
                                {theme === "light" ? "🌙" : "☀️"}
                            </span>
                        </button>

                        {!loading && (
                            <>
                                {isAuthenticated ? (
                                    <>
                                        <Link href="/dashboard" className={linkClass("/dashboard")}>
                                            Dashboard
                                        </Link>
                                        <span className="hidden sm:inline text-sm text-gray-500 dark:text-gray-400">
                                            👤 {user?.firstName || user?.name || user?.email}
                                        </span>
                                        <button
                                            onClick={handleLogout}
                                            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            Logout
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link href="/login" className={linkClass("/login")}>
                                            Sign In
                                        </Link>
                                        <Link
                                            href="/register"
                                            className="px-4 py-2 text-sm font-semibold text-white rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
                                        >
                                            Sign Up
                                        </Link>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

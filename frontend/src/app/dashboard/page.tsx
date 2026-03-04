"use client";

import { useEffect, useState, FC } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useAuth } from "@/components/auth-provider";
import { apiCall } from "@/lib/api";
import { DollarSign, Activity, Repeat2, TrendingUp, Clock, Trash2 } from "lucide-react";

import {
    Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from "recharts";

interface Stats {
    totalMonthlyCost?: number;
    monthlyTotal?: number;
    yearlyTotal?: number;
    totalCount?: number;
    totalSubscriptions?: number;
    activeCount?: number;
    activeSubscriptions?: number;
    highestSubscription?: { name: string; amount: number };
}

interface Subscription {
    id?: string;
    _id?: string;
    name?: string;
    merchantName?: string;
    amount?: number;
    status?: string;
    billingCycle?: string;
    nextBillingDate?: string;
    category?: string;
}

declare global {
    interface Window {
        Plaid: any;
    }
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(amount);
};

interface MetricCardProps {
    title: string;
    value: number | string;
    icon?: React.ReactNode;
    description?: string;
    valueClassName?: string;
}

const MetricCard: FC<MetricCardProps> = ({ title, value, icon, description, valueClassName }) => (
    <Card className="flex-1 min-w-[250px] transition-all hover:shadow-md hover:border-purple-500/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className={`text-2xl font-bold ${valueClassName}`}>
                {value}
            </div>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </CardContent>
    </Card>
);

export default function DashboardPage() {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();

    const [stats, setStats] = useState<Stats | null>(null);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [detecting, setDetecting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated) fetchData();
    }, [isAuthenticated]);

    const fetchData = async () => {
        try {
            const [statsRes, subsRes, accountsRes] = await Promise.all([
                apiCall("/subscriptions/stats"),
                apiCall("/subscriptions"),
                apiCall("/plaid/accounts").catch(() => ({ success: true, data: [] })),
            ]);
            setStats(statsRes.data || statsRes);
            setSubscriptions(subsRes.data || subsRes || []);
            setAccounts(accountsRes.data || accountsRes || []);
        } catch {
            setToast({ message: "Failed to load data. Please try again.", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const initializePlaid = async () => {
        try {
            const response = await apiCall("/plaid/link-token", { method: "POST" });
            const link_token = response.data?.linkToken || response.linkToken || response.data?.link_token || response.link_token;
            if (!link_token) throw new Error("Failed to get link token");

            const handler = window.Plaid.create({
                token: link_token,
                onSuccess: async (public_token: string) => {
                    try {
                        setSyncing(true);
                        await apiCall("/plaid/exchange-public-token", {
                            method: "POST",
                            body: JSON.stringify({ publicToken: public_token }),
                        });
                        setToast({ message: "Bank connected successfully!", type: "success" });
                        fetchData();
                    } catch (error: any) {
                        setToast({ message: error.message, type: "error" });
                    } finally {
                        setSyncing(false);
                    }
                },
            });
            handler.open();
        } catch (error: any) {
            setToast({ message: error.message, type: "error" });
        }
    };

    const syncTransactions = async () => {
        try {
            setSyncing(true);
            await apiCall("/plaid/sync-transactions", { method: "POST" });
            setToast({ message: "Transactions synced successfully!", type: "success" });
            fetchData();
        } catch (error: any) {
            setToast({ message: error.message, type: "error" });
        } finally {
            setSyncing(false);
        }
    };

    const detectSubscriptions = async () => {
        try {
            setDetecting(true);
            await apiCall("/subscriptions/detect", { method: "POST" });
            setToast({ message: "Subscriptions detected successfully!", type: "success" });
            fetchData();
        } catch (error: any) {
            setToast({ message: error.message, type: "error" });
        } finally {
            setDetecting(false);
        }
    };

    const deleteSubscription = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this subscription?")) return;
        try {
            await apiCall(`/subscriptions/${id}`, { method: "DELETE" });
            setToast({ message: "Subscription deleted", type: "success" });
            fetchData();
        } catch (error: any) {
            setToast({ message: error.message, type: "error" });
        }
    };

    if (authLoading || (!isAuthenticated && !loading) || loading) {
        return (
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-background">
                <Activity className="h-10 w-10 text-primary animate-spin" />
            </div>
        );
    }

    const monthlyTotal = stats?.totalMonthlyCost || stats?.monthlyTotal || 0;
    const yearlyTotal = stats?.yearlyTotal || monthlyTotal * 12 || 0;
    const activeSubs = stats?.activeCount || stats?.activeSubscriptions || 0;

    const chartData = [
        { name: "Monthly Total", amount: monthlyTotal, fill: "rgba(139, 92, 246, 0.8)" },
        { name: "Yearly Total", amount: yearlyTotal, fill: "rgba(168, 85, 247, 0.8)" }
    ];

    const highestSub = stats?.highestSubscription;

    return (
        <>
            <Script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js" strategy="afterInteractive" />

            <div className="min-h-[calc(100vh-64px)] bg-background text-foreground transition-colors p-4 md:p-8 animate-fade-in">

                {toast && (
                    <div className={`fixed top-20 right-4 z-50 animate-slide-in ${toast.type === "success" ? "bg-emerald-500" : "bg-red-500"} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[280px] max-w-md`}>
                        <span className="text-xl font-bold">{toast.type === "success" ? "✓" : "✕"}</span>
                        <p className="flex-1 font-medium">{toast.message}</p>
                        <button onClick={() => setToast(null)} className="ml-2 text-white/80 hover:text-white">✕</button>
                    </div>
                )}

                <div className="max-w-7xl mx-auto flex flex-col gap-6 md:gap-8">

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-primary drop-shadow-sm">
                                Subscription Dashboard
                            </h1>
                            <p className="text-md md:text-lg text-muted-foreground mt-1">
                                Welcome back{user?.firstName ? `, ${user.firstName}` : ""}! Here is your overview.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Button onClick={initializePlaid} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 transition-opacity text-white">
                                🏦 {accounts.length > 0 ? "Add Bank" : "Connect Bank"}
                            </Button>
                            {accounts.length > 0 && (
                                <>
                                    <Button variant="outline" onClick={syncTransactions} disabled={syncing}>
                                        {syncing ? <Activity className="mr-2 h-4 w-4 animate-spin" /> : "🔄 "} Sync
                                    </Button>
                                    <Button variant="outline" onClick={detectSubscriptions} disabled={detecting}>
                                        {detecting ? <Activity className="mr-2 h-4 w-4 animate-spin" /> : "🔍 "} Detect
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <MetricCard
                            title="Total Monthly Cost"
                            value={formatCurrency(monthlyTotal)}
                            icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                            description="Your recurring monthly spend"
                            valueClassName="text-purple-500"
                        />
                        <MetricCard
                            title="Active Subscriptions"
                            value={activeSubs}
                            icon={<Repeat2 className="h-4 w-4 text-muted-foreground" />}
                            description="Currently tracked services"
                        />
                        <MetricCard
                            title="Highest Subscription"
                            value={highestSub?.amount ? formatCurrency(highestSub.amount) : "$0.00"}
                            icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
                            description={highestSub?.name || "No data"}
                            valueClassName="text-pink-500"
                        />
                        <Card className="flex-1 min-w-[250px] transition-all hover:shadow-md hover:border-purple-500/30">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Bank Status</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground animate-pulse" />
                            </CardHeader>
                            <CardContent>
                                {accounts.length > 0 ? (
                                    <>
                                        <div className="text-2xl font-bold flex items-center gap-2">
                                            <span className="relative flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                            </span>
                                            Connected
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">{accounts.length} account(s) synced</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-2xl font-bold flex items-center gap-2 text-muted-foreground">
                                            <div className="h-3 w-3 rounded-full bg-gray-300 dark:bg-gray-600" />
                                            Disconnected
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">Connect your bank to start</p>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Chart */}
                        <Card className="lg:col-span-1 shadow-sm">
                            <CardHeader>
                                <CardTitle>Spending Overview</CardTitle>
                                <CardDescription>Monthly vs Yearly commitment</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis fontSize={12} tickLine={false} axisLine={false}
                                                tickFormatter={(value) => `$${value}`}
                                            />
                                            <RechartsTooltip
                                                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                formatter={(value: number) => [formatCurrency(value), "Amount"]}
                                            />
                                            <Bar dataKey="amount" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* List */}
                        <Card className="lg:col-span-2 shadow-sm">
                            <CardHeader>
                                <CardTitle>Your Subscriptions</CardTitle>
                                <CardDescription>All actively tracked recurring charges</CardDescription>
                            </CardHeader>
                            <CardContent className="px-0 sm:px-6">
                                {subscriptions.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground">
                                        <p>No subscriptions found. Connect your bank and run detection!</p>
                                        <Button className="mt-4" onClick={initializePlaid}>Connect Bank</Button>
                                    </div>
                                ) : (
                                    <ScrollArea className="h-[400px] w-full pr-4">
                                        <div className="flex flex-col gap-3">
                                            {subscriptions.map((sub) => (
                                                <div key={sub.id || sub._id} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center text-lg font-bold text-purple-600 dark:text-purple-400">
                                                            {sub.name?.charAt(0).toUpperCase() || "S"}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-foreground">{sub.name || sub.merchantName}</span>
                                                            <span className="text-xs text-muted-foreground">{sub.category || "Subscription"} • {(sub.billingCycle || "MONTHLY").toLowerCase()}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4">
                                                        <div className="flex flex-col items-end">
                                                            <span className="font-bold text-lg text-foreground">{formatCurrency(sub.amount || 0)}</span>
                                                            {sub.status && (
                                                                <Badge variant="outline" className={`text-[10px] h-4 px-1 absolute hidden pointer-events-none`}>{sub.status}</Badge>
                                                            )}
                                                        </div>
                                                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50"
                                                            onClick={() => deleteSubscription((sub.id || sub._id) as string)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                )}
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </div>
        </>
    );
}

"use client";

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

interface SubscriptionCardProps {
    subscription: Subscription;
    onDelete: (id: string) => void;
}

export default function SubscriptionCard({
    subscription,
    onDelete,
}: SubscriptionCardProps) {
    const isActive =
        subscription.status === "active" || subscription.status === "ACTIVE";

    return (
        <div className="group rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-md hover:shadow-xl hover:-translate-y-1 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
                        {subscription.name || subscription.merchantName}
                    </h3>
                    <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${isActive
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            }`}
                    >
                        {subscription.status}
                    </span>
                </div>
                <button
                    onClick={() =>
                        onDelete((subscription.id || subscription._id) as string)
                    }
                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    aria-label={`Delete ${subscription.name || subscription.merchantName} subscription`}
                >
                    🗑️
                </button>
            </div>

            <div className="mb-4">
                <div className="text-3xl font-bold mb-1 text-purple-600 dark:text-purple-400">
                    ${(subscription.amount || 0).toFixed(2)}
                </div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {subscription.billingCycle || "monthly"}
                </p>
            </div>

            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {subscription.nextBillingDate && (
                    <div className="flex items-center gap-2">
                        <span>📅</span>
                        <span>
                            Next:{" "}
                            {new Date(subscription.nextBillingDate).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric", year: "numeric" }
                            )}
                        </span>
                    </div>
                )}
                {subscription.category && (
                    <div className="flex items-center gap-2">
                        <span>🏷️</span>
                        <span>{subscription.category}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

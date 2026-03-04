import React, { FC, useMemo } from 'react';
import { useRealtimeSalesData, SaleDataPoint, LatestPayment } from '@/demos/hooks/useRealtimeSalesData';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { DollarSign, Repeat2, TrendingUp, Activity, BarChart, Clock } from 'lucide-react';

// Helper for currency formatting
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

interface MetricCardProps {
    title: string;
    value: number;
    unit?: string;
    icon?: React.ReactNode;
    description?: string;
    valueClassName?: string;
}

const MetricCard: FC<MetricCardProps> = ({ title, value, unit = '', icon, description, valueClassName }) => (
    <Card className="flex-1 min-w-[250px]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className={`text-2xl font-bold ${valueClassName}`}>
                {unit}{typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </div>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </CardContent>
    </Card>
);

interface RealtimeChartProps {
    data: SaleDataPoint[];
    title: string;
    dataKey: keyof SaleDataPoint;
    lineColor: string;
    tooltipFormatter?: (value: number) => string;
    legendName: string;
}

const RealtimeChart: FC<RealtimeChartProps> = React.memo(({ data, title, dataKey, lineColor, tooltipFormatter, legendName }) => {
    // Memoize the chart data and filter to show only last 2 minutes of data
    const chartData = useMemo(() => {
        const validData = data || [];
        if (validData.length === 0) return [];

        // Get current time and calculate 2 minutes ago
        const now = new Date();
        const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);

        // Filter data to show only last 2 minutes
        const filteredData = validData.filter(point => {
            if (!point.time) return false;

            // Parse the time string (assuming format like "HH:MM:SS")
            const timeParts = point.time.split(':');
            if (timeParts.length !== 3) return true; // Keep if we can't parse

            const pointTime = new Date();
            pointTime.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), parseInt(timeParts[2]));

            return pointTime >= twoMinutesAgo;
        });

        // If no data in last 2 minutes, show last 10 points to ensure something is visible
        return filteredData.length > 0 ? filteredData : validData.slice(-10);
    }, [data]);

    // Create a stable key for the LineChart to prevent complete re-mounting
    const chartKey = useMemo(() => `chart-${title}-${dataKey}`, [title, dataKey]);

    // Theme-aware colors
    const isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    const colors = {
        grid: isDark ? '#374151' : '#e5e7eb',
        axis: isDark ? '#9ca3af' : '#6b7280',
        tooltipBg: isDark ? '#1f2937' : '#ffffff',
        tooltipBorder: isDark ? '#374151' : '#d1d5db',
        tooltipText: isDark ? '#f9fafb' : '#111827',
        legend: isDark ? '#9ca3af' : '#6b7280',
        cursor: lineColor === '#3b82f6' || lineColor.includes('primary') ? '#3b82f6' : '#8b5cf6'
    };

    return (
        <Card className="flex-1 min-w-[300px] max-w-full lg:max-w-[calc(50%-16px)]">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart className="h-5 w-5 text-blue-600" />{title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div style={{ width: '100%', height: '350px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            key={chartKey}
                            data={chartData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} strokeOpacity={0.5} />
                            <XAxis
                                dataKey="time"
                                stroke={colors.axis}
                                fontSize={12}
                                interval="preserveStartEnd"
                                tick={{ fontSize: 10 }}
                                tickFormatter={(tick) => {
                                    if (typeof tick === 'string' && tick.includes(':')) {
                                        // Show only minutes:seconds for better readability
                                        const parts = tick.split(':');
                                        return parts.length >= 3 ? `${parts[1]}:${parts[2]}` : tick;
                                    }
                                    return tick;
                                }}
                                domain={['dataMin', 'dataMax']}
                            />
                            <YAxis
                                stroke={colors.axis}
                                fontSize={12}
                                tickFormatter={tooltipFormatter as any || ((value: any) => value.toString())}
                            />
                            <RechartsTooltip
                                cursor={{ stroke: colors.cursor, strokeWidth: 1 }}
                                contentStyle={{
                                    backgroundColor: colors.tooltipBg,
                                    borderColor: colors.tooltipBorder,
                                    borderRadius: '0.5rem',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                                itemStyle={{ color: colors.tooltipText }}
                                labelStyle={{ color: colors.legend }}
                                formatter={tooltipFormatter ? (value: any) => {
                                    const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
                                    return [tooltipFormatter(numValue), legendName];
                                } : undefined}
                            />
                            <Legend wrapperStyle={{ color: colors.legend, paddingTop: '10px' }} />
                            <Line
                                type="monotone"
                                dataKey={dataKey}
                                stroke={lineColor}
                                strokeWidth={2}
                                dot={false}
                                name={legendName}
                                connectNulls={false}
                                isAnimationActive={chartData.length <= 1} // Only animate on first render
                                animationBegin={0}
                                animationDuration={800}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
});

export const SalesDashboard: FC = () => {
    const {
        totalRevenue,
        cumulativeRevenueData,
        salesCount,
        averageSale,
        salesChartData,
        latestPayments,
    } = useRealtimeSalesData();

    // Ensure data is valid and has the correct structure
    const safeSalesChartData = Array.isArray(salesChartData) ? salesChartData : [];
    const safeCumulativeRevenueData = Array.isArray(cumulativeRevenueData) ? cumulativeRevenueData : [];
    const safeLatestPayments = Array.isArray(latestPayments) ? latestPayments : [];

    return (
        <div className="w-full bg-background text-foreground flex flex-col gap-4 md:gap-8 transition-none animate-fade-in">

            {/* Metrics Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Subscriptions Cost"
                    value={totalRevenue || 0}
                    unit="$"
                    icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                    description="Cumulative tracking value"
                    valueClassName="text-emerald-500"
                />
                <MetricCard
                    title="Tracked Items"
                    value={salesCount || 0}
                    icon={<Repeat2 className="h-4 w-4 text-muted-foreground" />}
                    description="Number of recurring charges found"
                />
                <MetricCard
                    title="Average Monthly Cost"
                    value={averageSale || 0}
                    unit="$"
                    icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
                    description="Average value per subscription"
                    valueClassName="text-blue-400"
                />
                <Card className="flex-1 min-w-[250px]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monitoring Status</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground animate-pulse" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            Active
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Real-time Plaid connection stable</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="flex flex-col lg:flex-row gap-6 w-full">
                <RealtimeChart
                    data={safeSalesChartData}
                    title="Latest Charges"
                    dataKey="sales"
                    lineColor="#3b82f6"
                    tooltipFormatter={formatCurrency}
                    legendName="Charge Amount"
                />
                <RealtimeChart
                    data={safeCumulativeRevenueData}
                    title="Cumulative Subscription Spend Trend"
                    dataKey="sales"
                    lineColor="#8b5cf6"
                    tooltipFormatter={formatCurrency}
                    legendName="Total Amount"
                />
            </div>

            {/* Latest Payments Section */}
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary" /> Recent Charges
                    </CardTitle>
                    <CardDescription>Recently identified subscription transactions from your bank.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[250px] md:h-[300px] lg:h-[300px]">
                        <div className="divide-y divide-border">
                            {safeLatestPayments.length === 0 ? (
                                <p className="p-4 text-center text-muted-foreground">No recent charges...</p>
                            ) : (
                                safeLatestPayments.map((payment) => (
                                    <div key={payment.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-lg">{formatCurrency(payment.amount || 0)}</span>
                                            <span className="text-sm text-muted-foreground">{payment.product}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs text-muted-foreground">{payment.time}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
                <CardFooter className="pt-4 text-sm text-muted-foreground">
                    <p>Displaying the most recent transactions.</p>
                </CardFooter>
            </Card>
        </div>
    );
};

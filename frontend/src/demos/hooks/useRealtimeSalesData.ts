"use client";

import { useState, useEffect } from 'react';

export interface SaleDataPoint {
    time: string;
    sales: number;
}

export interface LatestPayment {
    id: string;
    amount: number;
    product: string;
    customer: string;
    time: string;
}

export function useRealtimeSalesData() {
    const [totalRevenue, setTotalRevenue] = useState(125430.50);
    const [salesCount, setSalesCount] = useState(1432);
    const [averageSale, setAverageSale] = useState(87.59);

    const [salesChartData, setSalesChartData] = useState<SaleDataPoint[]>([]);
    const [cumulativeRevenueData, setCumulativeRevenueData] = useState<SaleDataPoint[]>([]);
    const [latestPayments, setLatestPayments] = useState<LatestPayment[]>([]);

    useEffect(() => {
        // Generate initial realistic mock data
        const initialChartData: SaleDataPoint[] = [];
        const initialCumulativeData: SaleDataPoint[] = [];
        const initialPayments: LatestPayment[] = [];

        let currentCumulative = 120000;
        const now = new Date();

        for (let i = 20; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 2000);
            const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}`;

            const sales = Math.floor(Math.random() * 50) + 10;
            currentCumulative += sales;

            initialChartData.push({ time: timeStr, sales });
            initialCumulativeData.push({ time: timeStr, sales: currentCumulative });

            if (i < 10) {
                initialPayments.push({
                    id: `pay_${Math.random().toString(36).substring(7)}`,
                    amount: +(Math.random() * 200 + 10).toFixed(2),
                    product: ['Pro Plan', 'Basic Plan', 'Enterprise', 'Add-on'][Math.floor(Math.random() * 4)],
                    customer: `User ${Math.floor(Math.random() * 9000) + 1000}`,
                    time: timeStr
                });
            }
        }

        setSalesChartData(initialChartData);
        setCumulativeRevenueData(initialCumulativeData);
        setLatestPayments(initialPayments.reverse());

        // Setup interval for live updates
        const interval = setInterval(() => {
            const time = new Date();
            const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}`;
            const newSaleAmount = +(Math.random() * 100).toFixed(2);

            setTotalRevenue(prev => prev + newSaleAmount);
            setSalesCount(prev => prev + 1);

            setSalesChartData(prev => {
                const newData = [...prev, { time: timeStr, sales: newSaleAmount }];
                if (newData.length > 50) newData.shift();
                return newData;
            });

            setCumulativeRevenueData(prev => {
                const lastVal = prev.length > 0 ? prev[prev.length - 1].sales : 120000;
                const newData = [...prev, { time: timeStr, sales: lastVal + newSaleAmount }];
                if (newData.length > 50) newData.shift();
                return newData;
            });

            setLatestPayments(prev => {
                const newPayment = {
                    id: `pay_${Math.random().toString(36).substring(7)}`,
                    amount: newSaleAmount,
                    product: ['Pro Plan', 'Basic Plan', 'Enterprise', 'Add-on'][Math.floor(Math.random() * 4)],
                    customer: `User ${Math.floor(Math.random() * 9000) + 1000}`,
                    time: timeStr
                };
                const newData = [newPayment, ...prev];
                if (newData.length > 10) newData.pop();
                return newData;
            });

        }, 2000);

        return () => clearInterval(interval);
    }, []);

    return {
        totalRevenue,
        salesCount,
        averageSale,
        salesChartData,
        cumulativeRevenueData,
        latestPayments
    };
}

import React from 'react';
import { SalesDashboard } from '@/components/ui/live-sales-dashboard';

export default function SalesDashboardDemo() {
    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <SalesDashboard />
            </div>
        </div>
    );
}

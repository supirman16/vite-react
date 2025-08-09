import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';

interface AgencyTrendChartProps {
    rekapData: any[];
}

export default function AgencyTrendChart({ rekapData }: AgencyTrendChartProps) {
    const trendData = useMemo(() => {
        const dailyTotals = rekapData.reduce((acc, rekap) => {
            const date = new Date(rekap.tanggal_live).toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + rekap.pendapatan;
            return acc;
        }, {} as Record<string, number>);
        const sortedDates = Object.keys(dailyTotals).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        const labels = sortedDates.map(date => new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }));
        const data = sortedDates.map(date => dailyTotals[date]);
        return { labels, data };
    }, [rekapData]);

    const chartData = {
        labels: trendData.labels,
        datasets: [{
            label: 'Total Diamond per Hari',
            data: trendData.data,
            fill: true,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.1
        }]
    };

    return (
        <div className="bg-white dark:bg-stone-800 p-6 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700">
            <h2 className="text-xl font-semibold mb-4">Tren Kinerja Anda</h2>
            <div className="relative h-80">
                <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
        </div>
    );
}
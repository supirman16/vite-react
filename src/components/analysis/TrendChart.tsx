import React, { useContext, useState, useMemo } from 'react';
import { AppContext, AppContextType } from '../../App';
import { Line } from 'react-chartjs-2';

interface TrendChartProps {
    selectedHostId: string;
}

export default function TrendChart({ selectedHostId }: TrendChartProps) {
    const { data } = useContext(AppContext) as AppContextType;
    const [metric, setMetric] = useState('revenue'); // 'revenue' atau 'duration'

    const trendData = useMemo(() => {
        const labels: string[] = [];
        const revenueData: number[] = [];
        const durationData: number[] = [];

        if (!selectedHostId) return { labels, revenueData, durationData };

        const hostRekaps = data.rekapLive.filter(r => r.host_id === parseInt(selectedHostId) && r.status === 'approved');

        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            labels.push(date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }));

            const rekapsForDay = hostRekaps.filter(r => r.tanggal_live === dateString);
            
            const dailyRevenue = rekapsForDay.reduce((sum, r) => sum + r.pendapatan, 0);
            const dailyDuration = rekapsForDay.reduce((sum, r) => sum + r.durasi_menit, 0);

            revenueData.push(dailyRevenue);
            durationData.push(dailyDuration);
        }

        return { labels, revenueData, durationData };
    }, [data.rekapLive, selectedHostId]);

    const chartData = {
        labels: trendData.labels,
        datasets: [
            {
                label: metric === 'revenue' ? 'Pendapatan Diamond' : 'Durasi Live (Menit)',
                data: metric === 'revenue' ? trendData.revenueData : trendData.durationData,
                borderColor: 'rgb(168, 85, 247)',
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                fill: true,
                tension: 0.4,
            },
        ],
    };

    return (
        <div className="mt-8 bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm p-6 rounded-xl border border-purple-300 dark:border-cyan-400/30 shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <h2 className="text-xl font-semibold text-stone-800 dark:text-white">Tren Kinerja 30 Hari Terakhir</h2>
                <div className="flex items-center space-x-2 mt-2 sm:mt-0 bg-stone-100 dark:bg-stone-700 p-1 rounded-lg">
                    <button onClick={() => setMetric('revenue')} className={`px-3 py-1 text-sm font-semibold rounded-md ${metric === 'revenue' ? 'bg-white dark:bg-stone-800 shadow' : 'text-stone-600 dark:text-stone-300'}`}>Diamond</button>
                    <button onClick={() => setMetric('duration')} className={`px-3 py-1 text-sm font-semibold rounded-md ${metric === 'duration' ? 'bg-white dark:bg-stone-800 shadow' : 'text-stone-600 dark:text-stone-300'}`}>Durasi</button>
                </div>
            </div>
            <div className="relative h-80">
                <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
        </div>
    );
}

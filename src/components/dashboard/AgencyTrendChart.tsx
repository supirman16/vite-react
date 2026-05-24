import React, { useMemo, useContext } from 'react';
import { Line } from 'react-chartjs-2';
import { AppContext, AppContextType } from '../../App';
import { 
    Chart as ChartJS, 
    CategoryScale, 
    LinearScale, 
    PointElement, 
    LineElement, 
    Title, 
    Tooltip, 
    Legend, 
    Filler,
    ChartOptions
} from 'chart.js';
import { TrendingUp } from 'lucide-react';

// Registrasi semua komponen ChartJS yang dibutuhkan secara lokal
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface AgencyTrendChartProps {
    rekapData: any[];
}

export default function AgencyTrendChart({ rekapData }: AgencyTrendChartProps) {
    const { theme } = useContext(AppContext) as AppContextType;
    const isDark = theme === 'dark';

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

    const chartData = useMemo(() => {
        return {
            labels: trendData.labels,
            datasets: [{
                label: 'Total Diamond per Hari',
                data: trendData.data,
                fill: true,
                borderColor: isDark ? 'rgb(6, 182, 212)' : 'rgb(236, 72, 153)', // Cyan in dark, Pink in light
                backgroundColor: isDark ? 'rgba(6, 182, 212, 0.15)' : 'rgba(236, 72, 153, 0.08)',
                tension: 0.4,
                pointBackgroundColor: isDark ? 'rgb(6, 182, 212)' : 'rgb(236, 72, 153)',
                pointBorderColor: isDark ? '#ffffff' : '#1c1917',
                pointHoverRadius: 7,
                borderWidth: 3.5,
            }]
        };
    }, [trendData, isDark]);

    const chartOptions: ChartOptions<'line'> = useMemo(() => {
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
        const textColor = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)';
        const legendColor = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)';

        return {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index' as const,
                intersect: false,
            },
            scales: {
                x: {
                    grid: {
                        color: gridColor,
                        drawTicks: false,
                    },
                    ticks: {
                        color: textColor,
                        font: { family: 'Inter, system-ui, sans-serif', size: 11 },
                    }
                },
                y: {
                    type: 'linear' as const,
                    display: true,
                    position: 'left' as const,
                    grid: {
                        color: gridColor,
                        drawTicks: false,
                    },
                    ticks: {
                        color: textColor,
                        font: { family: 'Inter, system-ui, sans-serif', size: 11 },
                    },
                    title: {
                        display: true,
                        text: 'Diamond 💎',
                        color: textColor,
                        font: { weight: 'bold' as const, size: 11 }
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top' as const,
                    labels: {
                        color: legendColor,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: { family: 'Fredoka, Inter, system-ui, sans-serif', weight: 'bold' as const, size: 12 },
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: isDark ? 'rgba(23, 23, 23, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    titleColor: isDark ? '#ffffff' : '#1c1917',
                    bodyColor: isDark ? '#d6d3d1' : '#44403c',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                    borderWidth: 1,
                    padding: 12,
                    titleFont: { family: 'Inter, system-ui, sans-serif', weight: 'bold' as const, size: 13 },
                    bodyFont: { family: 'Inter, system-ui, sans-serif', size: 12 },
                    boxPadding: 6,
                    cornerRadius: 8,
                }
            }
        };
    }, [isDark]);

    return (
        <div className="bg-white dark:bg-stone-900 p-6 rounded-xl manga-panel transition-colors duration-300">
            <h2 className="text-xl font-extrabold mb-4 text-stone-800 dark:text-white flex items-center">
                <TrendingUp className="w-5 h-5 mr-2.5 text-pink-500 dark:text-cyan-400" />
                Tren Kinerja Agensi
            </h2>
            <div className="relative h-80">
                <Line data={chartData} options={chartOptions} />
            </div>
        </div>
    );
}
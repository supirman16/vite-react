import React, { useContext, useState, useMemo } from 'react';
import { AppContext, AppContextType } from '../../App';
import { Line } from 'react-chartjs-2';
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
import { Diamond, Clock, Zap, Calendar, TrendingUp } from 'lucide-react';

// Registrasi semua komponen ChartJS yang dibutuhkan termasuk Filler untuk gradient area
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface TrendChartProps {
    selectedHostId: string;
    currentDate?: Date;
}

export default function TrendChart({ selectedHostId, currentDate = new Date() }: TrendChartProps) {
    const { data, theme } = useContext(AppContext) as AppContextType;
    const [metric, setMetric] = useState<'revenue' | 'duration' | 'both'>('both'); // 'revenue', 'duration', atau 'both'
    const [period, setPeriod] = useState<'7d' | '30d' | 'month'>('30d'); // '7d', '30d', atau 'month'

    const isDark = theme === 'dark';

    const trendData = useMemo(() => {
        const labels: string[] = [];
        const revenueData: number[] = [];
        const durationHoursData: number[] = [];
        const rawDates: string[] = [];

        if (!selectedHostId) return { labels, revenueData, durationHoursData, rawDates };

        const hostRekaps = data.rekapLive.filter(
            r => r.host_id === parseInt(selectedHostId) && r.status === 'approved'
        );

        const today = new Date();

        if (period === '7d') {
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                const dateString = date.toISOString().split('T')[0];
                rawDates.push(dateString);
                labels.push(date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }));

                const rekapsForDay = hostRekaps.filter(r => r.tanggal_live === dateString);
                const dailyRevenue = rekapsForDay.reduce((sum, r) => sum + r.pendapatan, 0);
                const dailyDurationMinutes = rekapsForDay.reduce((sum, r) => sum + r.durasi_menit, 0);

                revenueData.push(dailyRevenue);
                durationHoursData.push(parseFloat((dailyDurationMinutes / 60).toFixed(1)));
            }
        } else if (period === '30d') {
            for (let i = 29; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                const dateString = date.toISOString().split('T')[0];
                rawDates.push(dateString);
                labels.push(date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }));

                const rekapsForDay = hostRekaps.filter(r => r.tanggal_live === dateString);
                const dailyRevenue = rekapsForDay.reduce((sum, r) => sum + r.pendapatan, 0);
                const dailyDurationMinutes = rekapsForDay.reduce((sum, r) => sum + r.durasi_menit, 0);

                revenueData.push(dailyRevenue);
                durationHoursData.push(parseFloat((dailyDurationMinutes / 60).toFixed(1)));
            }
        } else if (period === 'month') {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            for (let day = 1; day <= daysInMonth; day++) {
                const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                rawDates.push(dateString);
                
                // Format label: "dd Mmm" (misal: "01 Mei")
                const labelDate = new Date(year, month, day);
                labels.push(labelDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }));

                const rekapsForDay = hostRekaps.filter(r => r.tanggal_live === dateString);
                const dailyRevenue = rekapsForDay.reduce((sum, r) => sum + r.pendapatan, 0);
                const dailyDurationMinutes = rekapsForDay.reduce((sum, r) => sum + r.durasi_menit, 0);

                revenueData.push(dailyRevenue);
                durationHoursData.push(parseFloat((dailyDurationMinutes / 60).toFixed(1)));
            }
        }

        return { labels, revenueData, durationHoursData, rawDates };
    }, [data.rekapLive, selectedHostId, period, currentDate]);

    // Kalkulasi Statistik Ringkasan Periode
    const stats = useMemo(() => {
        if (trendData.revenueData.length === 0) {
            return { totalRevenue: 0, avgRevenue: 0, totalHours: 0, peakRevenue: 0, peakDate: '-', activeDays: 0 };
        }

        const totalRevenue = trendData.revenueData.reduce((sum, val) => sum + val, 0);
        const totalHours = trendData.durationHoursData.reduce((sum, val) => sum + val, 0);
        
        let activeDays = 0;
        let peakRevenue = 0;
        let peakIndex = -1;

        trendData.revenueData.forEach((rev, index) => {
            if (rev > 0 || trendData.durationHoursData[index] > 0) {
                activeDays++;
            }
            if (rev > peakRevenue) {
                peakRevenue = rev;
                peakIndex = index;
            }
        });

        const avgRevenue = activeDays > 0 ? Math.round(totalRevenue / activeDays) : 0;
        const peakDate = peakIndex !== -1 ? trendData.labels[peakIndex] : '-';

        return {
            totalRevenue,
            avgRevenue,
            totalHours: parseFloat(totalHours.toFixed(1)),
            peakRevenue,
            peakDate,
            activeDays
        };
    }, [trendData]);

    // Konfigurasi Datasets
    const chartData = useMemo(() => {
        const datasets = [];

        // Dataset Pendapatan (Diamond) - Sumbu Y Kiri
        if (metric === 'revenue' || metric === 'both') {
            datasets.push({
                label: 'Pendapatan (Diamond)',
                data: trendData.revenueData,
                borderColor: 'rgb(168, 85, 247)', // Purple-500
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                fill: true,
                tension: 0.4,
                yAxisID: 'y',
                pointBackgroundColor: 'rgb(168, 85, 247)',
                pointBorderColor: '#fff',
                pointHoverRadius: 6,
                borderWidth: 3,
            });
        }

        // Dataset Durasi (Jam) - Sumbu Y Kanan (jika 'both') atau Sumbu Y Kiri (jika 'duration')
        if (metric === 'duration' || metric === 'both') {
            datasets.push({
                label: 'Durasi Live (Jam)',
                data: trendData.durationHoursData,
                borderColor: 'rgb(6, 182, 212)', // Cyan-500
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
                fill: true,
                tension: 0.4,
                yAxisID: metric === 'both' ? 'y1' : 'y',
                pointBackgroundColor: 'rgb(6, 182, 212)',
                pointBorderColor: '#fff',
                pointHoverRadius: 6,
                borderWidth: 3,
            });
        }

        return {
            labels: trendData.labels,
            datasets
        };
    }, [trendData, metric]);

    // Konfigurasi Pilihan Grafik Adaptif Mode Light/Dark
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
                        text: metric === 'duration' ? 'Durasi (Jam)' : 'Diamond 💎',
                        color: textColor,
                        font: { weight: 'bold' as const, size: 11 }
                    }
                },
                y1: {
                    type: 'linear' as const,
                    display: metric === 'both',
                    position: 'right' as const,
                    grid: {
                        drawOnChartArea: false, // Menghindari tumpukan garis grid
                    },
                    ticks: {
                        color: textColor,
                        font: { family: 'Inter, system-ui, sans-serif', size: 11 },
                    },
                    title: {
                        display: true,
                        text: 'Durasi (Jam) ⏱️',
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
                        font: { family: 'Inter, system-ui, sans-serif', weight: 'bold' as const, size: 12 },
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: isDark ? 'rgba(23, 23, 23, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    titleColor: isDark ? '#fff' : '#1c1917',
                    bodyColor: isDark ? '#d6d3d1' : '#44403c',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                    borderWidth: 1,
                    padding: 12,
                    titleFont: { family: 'Inter, system-ui, sans-serif', weight: 'bold' as const, size: 13 },
                    bodyFont: { family: 'Inter, system-ui, sans-serif', size: 12 },
                    boxPadding: 6,
                    cornerRadius: 8,
                    shadowColor: 'rgba(0, 0, 0, 0.15)',
                    shadowBlur: 10
                }
            }
        };
    }, [isDark, metric]);

    const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num);

    return (
        <div className="mt-8 bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm p-6 rounded-xl border border-purple-300 dark:border-cyan-400/30 shadow-lg transition-colors duration-300">
            {/* Header Kontrol Grafik */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-stone-800 dark:text-white flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2.5 text-purple-500 dark:text-cyan-400" />
                        Analitik & Tren Kinerja Host
                    </h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                        Visualisasi interaktif korelasi durasi siaran dan perolehan diamond.
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    {/* Selector Periode */}
                    <div className="flex items-center space-x-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-lg border border-stone-200 dark:border-stone-700">
                        <button 
                            onClick={() => setPeriod('7d')} 
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${period === '7d' ? 'bg-white dark:bg-stone-700 text-purple-600 dark:text-cyan-400 shadow-sm' : 'text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'}`}
                        >
                            7 Hari
                        </button>
                        <button 
                            onClick={() => setPeriod('30d')} 
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${period === '30d' ? 'bg-white dark:bg-stone-700 text-purple-600 dark:text-cyan-400 shadow-sm' : 'text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'}`}
                        >
                            30 Hari
                        </button>
                        <button 
                            onClick={() => setPeriod('month')} 
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${period === 'month' ? 'bg-white dark:bg-stone-700 text-purple-600 dark:text-cyan-400 shadow-sm' : 'text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'}`}
                        >
                            Bulan Ini
                        </button>
                    </div>

                    {/* Selector Metrik */}
                    <div className="flex items-center space-x-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-lg border border-stone-200 dark:border-stone-700">
                        <button 
                            onClick={() => setMetric('both')} 
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${metric === 'both' ? 'bg-white dark:bg-stone-700 text-purple-600 dark:text-cyan-400 shadow-sm' : 'text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'}`}
                        >
                            Keduanya
                        </button>
                        <button 
                            onClick={() => setMetric('revenue')} 
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${metric === 'revenue' ? 'bg-white dark:bg-stone-700 text-purple-600 dark:text-cyan-400 shadow-sm' : 'text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'}`}
                        >
                            Diamond
                        </button>
                        <button 
                            onClick={() => setMetric('duration')} 
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${metric === 'duration' ? 'bg-white dark:bg-stone-700 text-purple-600 dark:text-cyan-400 shadow-sm' : 'text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'}`}
                        >
                            Durasi
                        </button>
                    </div>
                </div>
            </div>

            {/* Canvas Grafik */}
            <div className="relative h-80 lg:h-96 w-full mb-6">
                <Line data={chartData} options={chartOptions} />
            </div>

            {/* Panel Ringkasan Statistik */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-6 border-t border-stone-200 dark:border-stone-700">
                <div className="bg-stone-50 dark:bg-stone-800/40 p-3.5 rounded-lg border border-stone-100 dark:border-stone-700/40">
                    <div className="flex items-center text-purple-500 mb-1.5">
                        <Diamond className="w-4 h-4 mr-1.5" />
                        <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Total Diamond</span>
                    </div>
                    <p className="text-lg font-bold text-stone-800 dark:text-white truncate">{formatNumber(stats.totalRevenue)}</p>
                </div>

                <div className="bg-stone-50 dark:bg-stone-800/40 p-3.5 rounded-lg border border-stone-100 dark:border-stone-700/40">
                    <div className="flex items-center text-cyan-500 mb-1.5">
                        <Clock className="w-4 h-4 mr-1.5" />
                        <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Total Durasi</span>
                    </div>
                    <p className="text-lg font-bold text-stone-800 dark:text-white truncate">{stats.totalHours} jam</p>
                </div>

                <div className="bg-stone-50 dark:bg-stone-800/40 p-3.5 rounded-lg border border-stone-100 dark:border-stone-700/40">
                    <div className="flex items-center text-amber-500 mb-1.5">
                        <TrendingUp className="w-4 h-4 mr-1.5" />
                        <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Rata-rata/Hari</span>
                    </div>
                    <p className="text-lg font-bold text-stone-800 dark:text-white truncate">{formatNumber(stats.avgRevenue)} 💎</p>
                </div>

                <div className="bg-stone-50 dark:bg-stone-800/40 p-3.5 rounded-lg border border-stone-100 dark:border-stone-700/40 col-span-1">
                    <div className="flex items-center text-emerald-500 mb-1.5">
                        <Zap className="w-4 h-4 mr-1.5" />
                        <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Puncak (Peak)</span>
                    </div>
                    <p className="text-lg font-bold text-stone-800 dark:text-white truncate">{formatNumber(stats.peakRevenue)} 💎</p>
                </div>

                <div className="bg-stone-50 dark:bg-stone-800/40 p-3.5 rounded-lg border border-stone-100 dark:border-stone-700/40 col-span-2 md:col-span-1">
                    <div className="flex items-center text-indigo-500 mb-1.5">
                        <Calendar className="w-4 h-4 mr-1.5" />
                        <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Hari Tertinggi</span>
                    </div>
                    <p className="text-base font-bold text-stone-800 dark:text-white truncate">{stats.peakDate}</p>
                </div>
            </div>
        </div>
    );
}

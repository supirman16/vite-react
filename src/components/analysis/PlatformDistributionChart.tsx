import React, { useContext, useState, useMemo } from 'react';
import { AppContext, AppContextType } from '../../App';
import { Doughnut } from 'react-chartjs-2';
import { 
    Chart as ChartJS, 
    ArcElement, 
    Tooltip, 
    Legend,
    ChartOptions
} from 'chart.js';
import { PieChart, Diamond, Clock, Info } from 'lucide-react';

// Registrasi komponen ChartJS yang dibutuhkan untuk Doughnut
ChartJS.register(ArcElement, Tooltip, Legend);

interface PlatformDistributionChartProps {
    selectedHostId: string;
    currentDate?: Date;
}

const PALETTE = [
    { bg: 'rgba(168, 85, 247, 0.8)', border: 'rgb(168, 85, 247)', text: 'text-purple-500' }, // Purple
    { bg: 'rgba(6, 182, 212, 0.8)', border: 'rgb(6, 182, 212)', text: 'text-cyan-500' },   // Cyan
    { bg: 'rgba(245, 158, 11, 0.8)', border: 'rgb(245, 158, 11)', text: 'text-amber-500' },  // Amber
    { bg: 'rgba(16, 185, 129, 0.8)', border: 'rgb(16, 185, 129)', text: 'text-emerald-500' }, // Emerald
    { bg: 'rgba(236, 72, 153, 0.8)', border: 'rgb(236, 72, 153)', text: 'text-pink-500' },   // Pink
    { bg: 'rgba(99, 102, 241, 0.8)', border: 'rgb(99, 102, 241)', text: 'text-indigo-500' }  // Indigo
];

export default function PlatformDistributionChart({ selectedHostId, currentDate = new Date() }: PlatformDistributionChartProps) {
    const { data, theme } = useContext(AppContext) as AppContextType;
    const [metric, setMetric] = useState<'revenue' | 'duration'>('revenue');
    const isDark = theme === 'dark';

    // 1. Filter rekap live approved milik host aktif pada bulan & tahun terpilih
    const hostRekaps = useMemo(() => {
        if (!selectedHostId) return [];
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        return data.rekapLive.filter(r => {
            const [recYear, recMonth] = r.tanggal_live.split('-').map(Number);
            return r.host_id === parseInt(selectedHostId) && 
                   recYear === year && 
                   (recMonth - 1) === month && 
                   r.status === 'approved';
        });
    }, [selectedHostId, currentDate, data.rekapLive]);

    // 2. Agregasikan data berdasarkan tiktok_account_id
    const accountContributions = useMemo(() => {
        const revenueMap: { [key: number]: number } = {};
        const durationMap: { [key: number]: number } = {};

        hostRekaps.forEach(r => {
            const accId = r.tiktok_account_id;
            if (!accId) return;
            revenueMap[accId] = (revenueMap[accId] || 0) + r.pendapatan;
            durationMap[accId] = (durationMap[accId] || 0) + r.durasi_menit;
        });

        const list = Object.keys(revenueMap).map(idStr => {
            const id = parseInt(idStr);
            const account = data.tiktokAccounts.find(t => t.id === id);
            const username = account ? `@${account.username}` : `Akun #${id}`;
            const revenue = revenueMap[id];
            const durationHours = parseFloat((durationMap[id] / 60).toFixed(1));

            return {
                id,
                username,
                revenue,
                durationHours
            };
        });

        // Urutkan berdasarkan performa (Diamond tertinggi dulu)
        return list.sort((a, b) => b.revenue - a.revenue);
    }, [hostRekaps, data.tiktokAccounts]);

    // 3. Kalkulasi total agregat untuk persentase
    const totals = useMemo(() => {
        const totalRev = accountContributions.reduce((sum, item) => sum + item.revenue, 0);
        const totalDur = accountContributions.reduce((sum, item) => sum + item.durationHours, 0);
        return {
            revenue: totalRev,
            duration: totalDur
        };
    }, [accountContributions]);

    // 4. Hitung daftar kontribusi dengan persentase untuk legenda dan grafik
    const processedList = useMemo(() => {
        return accountContributions.map((item, idx) => {
            const colorInfo = PALETTE[idx % PALETTE.length];
            const percentage = metric === 'revenue' 
                ? (totals.revenue > 0 ? (item.revenue / totals.revenue) * 100 : 0)
                : (totals.duration > 0 ? (item.durationHours / totals.duration) * 100 : 0);

            return {
                ...item,
                percentage: parseFloat(percentage.toFixed(1)),
                color: colorInfo
            };
        });
    }, [accountContributions, totals, metric]);

    // 5. Konfigurasi Grafik Chart.js
    const chartData = useMemo(() => {
        return {
            labels: processedList.map(item => item.username),
            datasets: [
                {
                    data: processedList.map(item => metric === 'revenue' ? item.revenue : item.durationHours),
                    backgroundColor: processedList.map(item => item.color.bg),
                    borderColor: isDark ? 'rgba(23, 23, 23, 1)' : '#ffffff',
                    borderWidth: 2,
                    hoverOffset: 8,
                }
            ]
        };
    }, [processedList, metric, isDark]);

    const chartOptions: ChartOptions<'doughnut'> = useMemo(() => {
        const textMuted = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
        return {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    display: false // Kita matikan legenda bawaan karena akan membuat legenda kustom premium di kanan
                },
                tooltip: {
                    backgroundColor: isDark ? 'rgba(23, 23, 23, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    titleColor: isDark ? '#fff' : '#1c1917',
                    bodyColor: isDark ? '#d6d3d1' : '#44403c',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            const val = context.raw as number;
                            const idx = context.dataIndex;
                            const pct = processedList[idx]?.percentage || 0;
                            if (metric === 'revenue') {
                                return ` ${new Intl.NumberFormat('id-ID').format(val)} Diamond (${pct}%)`;
                            } else {
                                return ` ${val} Jam (${pct}%)`;
                            }
                        }
                    },
                    titleFont: { family: 'Inter, system-ui, sans-serif', weight: 'bold' as const, size: 12 },
                    bodyFont: { family: 'Inter, system-ui, sans-serif', size: 12 }
                }
            }
        };
    }, [isDark, processedList, metric]);

    const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num);

    // Render Fallback State jika tidak ada data siaran disetujui pada bulan aktif
    if (processedList.length === 0) {
        return (
            <div className="mt-8 bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm p-8 rounded-xl border border-stone-200 dark:border-stone-800 shadow-md text-center">
                <Info className="w-12 h-12 text-stone-400 dark:text-stone-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-stone-700 dark:text-stone-300">Belum Ada Data Kontribusi</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-md mx-auto">
                    Tidak ditemukan data live streaming yang berstatus disetujui (approved) pada bulan ini untuk host terpilih.
                </p>
            </div>
        );
    }

    return (
        <div className="mt-8 bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm p-6 rounded-xl border border-purple-300 dark:border-cyan-400/30 shadow-lg transition-colors duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-stone-800 dark:text-white flex items-center">
                        <PieChart className="w-5 h-5 mr-2.5 text-purple-500 dark:text-cyan-400" />
                        Analisis Kontribusi Akun TikTok
                    </h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                        Pembagian persentase kontribusi berdasarkan performa akun yang dikelola host.
                    </p>
                </div>

                {/* Switcher Metrik */}
                <div className="flex items-center space-x-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-lg border border-stone-200 dark:border-stone-700 self-start sm:self-auto">
                    <button
                        onClick={() => setMetric('revenue')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center ${metric === 'revenue' ? 'bg-white dark:bg-stone-700 text-purple-600 dark:text-cyan-400 shadow-sm' : 'text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'}`}
                    >
                        <Diamond className="w-3.5 h-3.5 mr-1.5 text-purple-500 dark:text-cyan-400" />
                        Diamond 💎
                    </button>
                    <button
                        onClick={() => setMetric('duration')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center ${metric === 'duration' ? 'bg-white dark:bg-stone-700 text-purple-600 dark:text-cyan-400 shadow-sm' : 'text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'}`}
                    >
                        <Clock className="w-3.5 h-3.5 mr-1.5 text-cyan-500" />
                        Durasi ⏱️
                    </button>
                </div>
            </div>

            {/* Layout Konten Utama: 2 Kolom (Chart di Kiri, Legenda/Data di Kanan) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Visual Chart */}
                <div className="lg:col-span-5 relative h-64 sm:h-72 w-full flex justify-center items-center">
                    <div className="w-full h-full max-w-[280px] max-h-[280px]">
                        <Doughnut data={chartData} options={chartOptions} />
                    </div>
                    {/* Ringkasan Nilai Total di Tengah Doughnut */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-400 dark:text-stone-500">
                            Total {metric === 'revenue' ? 'Diamond' : 'Durasi'}
                        </span>
                        <span className="text-xl font-extrabold text-stone-800 dark:text-white mt-0.5">
                            {metric === 'revenue' ? formatNumber(totals.revenue) : `${totals.duration} jam`}
                        </span>
                    </div>
                </div>

                {/* Panel Detail Akun (Kanan) */}
                <div className="lg:col-span-7 space-y-3">
                    <h3 className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">
                        Rincian Kontribusi
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {processedList.map((item) => (
                            <div 
                                key={item.id} 
                                className="group p-3 rounded-lg bg-stone-50/50 dark:bg-stone-800/40 border border-stone-200/50 dark:border-stone-800/40 hover:border-purple-300 dark:hover:border-cyan-400/50 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-sm"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center space-x-2 truncate">
                                        {/* Titik Warna Kategori */}
                                        <span 
                                            className="w-2.5 h-2.5 rounded-full shrink-0 flex"
                                            style={{ backgroundColor: item.color.border }}
                                        />
                                        <span className="text-sm font-semibold text-stone-700 dark:text-stone-200 truncate group-hover:text-purple-600 dark:group-hover:text-cyan-400 transition-colors">
                                            {item.username}
                                        </span>
                                    </div>
                                    <span className="text-xs font-bold text-stone-500 dark:text-stone-400 bg-stone-200/50 dark:bg-stone-800 px-1.5 py-0.5 rounded">
                                        {item.percentage}%
                                    </span>
                                </div>
                                
                                <div className="flex items-center text-xs font-bold text-stone-800 dark:text-stone-200 mt-1.5 pl-5">
                                    {metric === 'revenue' ? (
                                        <>
                                            <Diamond className="w-3.5 h-3.5 text-purple-500 dark:text-cyan-400 mr-1.5" />
                                            {formatNumber(item.revenue)} Diamond
                                        </>
                                    ) : (
                                        <>
                                            <Clock className="w-3.5 h-3.5 text-cyan-500 mr-1.5" />
                                            {item.durationHours} Jam Siaran
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

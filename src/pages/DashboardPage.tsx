import React, { useContext, useState } from 'react';
import { AppContext, AppContextType } from '../App';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Komponen ini adalah halaman utama Dashboard.
// Ia menampilkan KPI dan grafik performa.
export default function DashboardPage() {
    const { data } = useContext(AppContext) as AppContextType;

    const formatDiamond = (num: number) => new Intl.NumberFormat().format(num);
    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}j ${remainingMinutes}m`;
    };
    
    const kpiData = [
        { title: 'Total Host Aktif', value: data.hosts.filter(h => h.status === 'Aktif').length },
        { title: 'Total Jam Live', value: formatDuration(data.rekapLive.reduce((sum, r) => sum + r.durasi_menit, 0)) },
        { title: 'Total Diamond', value: `${formatDiamond(data.rekapLive.reduce((sum, r) => sum + r.pendapatan, 0))} 💎` },
    ];
    
    return (
        <section>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {kpiData.map(kpi => (
                    <div key={kpi.title} className="bg-white dark:bg-stone-800 p-6 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700">
                        <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400">{kpi.title}</h3>
                        <p className="text-3xl font-bold mt-2 text-stone-900 dark:text-white">{kpi.value}</p>
                    </div>
                ))}
            </div>
            <PerformanceChart />
        </section>
    );
}

// Komponen Grafik Performa, sekarang berada di dalam file DashboardPage
function PerformanceChart() {
    const { data } = useContext(AppContext) as AppContextType;
    const [metric, setMetric] = useState('duration');

    const chartData = {
        labels: data.hosts.map(h => h.nama_host),
        datasets: [
            {
                label: metric === 'duration' ? 'Total Durasi (Jam)' : 'Total Diamond',
                data: data.hosts.map(host => {
                    const hostRekap = data.rekapLive.filter(r => r.host_id === host.id);
                    if (metric === 'duration') {
                        return hostRekap.reduce((s, r) => s + r.durasi_menit, 0) / 60;
                    }
                    return hostRekap.reduce((s, r) => s + r.pendapatan, 0);
                }),
                backgroundColor: 'rgba(168, 85, 247, 0.6)',
                borderColor: 'rgba(147, 51, 234, 1)',
                borderWidth: 1,
                borderRadius: 6,
            },
        ],
    };

    return (
         <div className="bg-white dark:bg-stone-800 p-6 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <h2 className="text-xl font-semibold">Analisis Performa Host</h2>
                <select 
                    value={metric} 
                    onChange={(e) => setMetric(e.target.value)} 
                    className="mt-2 sm:mt-0 bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full sm:w-auto p-2.5 dark:bg-stone-700 dark:border-stone-600 dark:placeholder-stone-400 dark:text-white"
                >
                    <option value="duration">Total Durasi (Jam)</option>
                    <option value="revenue">Total Diamond</option>
                </select>
            </div>
            <div className="relative h-96">
                <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
        </div>
    );
}

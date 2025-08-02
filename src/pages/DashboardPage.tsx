import { useContext, useState } from 'react';
import { AppContext, AppContextType } from '../App';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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
                {kpiData.map((kpi, index) => (
                    <div 
                        key={kpi.title} 
                        className="bg-white dark:bg-stone-800 p-6 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 animate-slide-up-fade"
                        style={{ animationDelay: `${index * 100}ms`, opacity: 0 }} // Opacity 0 untuk awal animasi
                    >
                        <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400">{kpi.title}</h3>
                        <p className="text-3xl font-bold mt-2 text-stone-900 dark:text-white">{kpi.value}</p>
                    </div>
                ))}
            </div>
            <PerformanceChart />
        </section>
    );
}

function PerformanceChart() {
    // ... (Kode PerformanceChart tetap sama)
}

import { useContext, useState, useMemo } from 'react';
import { AppContext, AppContextType } from '../App';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import Skeleton from '../components/Skeleton';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Tipe data untuk rentang waktu
type DateRange = 'all' | 'today' | '7d' | 'thisMonth' | '30d';

// Komponen ini adalah halaman utama Dashboard.
export default function DashboardPage() {
    const { data } = useContext(AppContext) as AppContextType;
    const [dateRange, setDateRange] = useState<DateRange>('all');

    // Logika untuk menyaring data rekap berdasarkan rentang waktu yang dipilih
    const filteredRekap = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (!data.rekapLive) return [];

        switch (dateRange) {
            case 'today':
                return data.rekapLive.filter(r => new Date(r.tanggal_live) >= today);
            case '7d':
                const last7Days = new Date(today);
                last7Days.setDate(today.getDate() - 7);
                return data.rekapLive.filter(r => new Date(r.tanggal_live) >= last7Days);
            case 'thisMonth':
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                return data.rekapLive.filter(r => new Date(r.tanggal_live) >= startOfMonth);
            case '30d':
                 const last30Days = new Date(today);
                last30Days.setDate(today.getDate() - 30);
                return data.rekapLive.filter(r => new Date(r.tanggal_live) >= last30Days);
            case 'all':
            default:
                return data.rekapLive;
        }
    }, [data.rekapLive, dateRange]);

    // Tampilkan kerangka pemuatan jika data belum siap
    if (data.loading) {
        return <DashboardSkeleton />;
    }

    const formatDiamond = (num: number) => new Intl.NumberFormat().format(num);
    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}j ${remainingMinutes}m`;
    };
    
    // KPI sekarang dihitung dari data yang sudah disaring
    const kpiData = [
        { title: 'Total Host Aktif', value: data.hosts.filter(h => h.status === 'Aktif').length },
        { title: 'Total Jam Live', value: formatDuration(filteredRekap.reduce((sum, r) => sum + r.durasi_menit, 0)) },
        { title: 'Total Diamond', value: `${formatDiamond(filteredRekap.reduce((sum, r) => sum + r.pendapatan, 0))} 💎` },
    ];
    
    return (
        <section>
            <DateRangeFilter selectedRange={dateRange} onSelectRange={setDateRange} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {kpiData.map((kpi, index) => (
                    <div 
                        key={kpi.title} 
                        className="bg-white dark:bg-stone-800 p-6 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 animate-slide-up-fade"
                        style={{ animationDelay: `${index * 100}ms`, opacity: 0 }}
                    >
                        <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400">{kpi.title}</h3>
                        <p className="text-3xl font-bold mt-2 text-stone-900 dark:text-white">{kpi.value}</p>
                    </div>
                ))}
            </div>
            {/* Mengirim data yang sudah disaring ke komponen grafik */}
            <PerformanceChart rekapData={filteredRekap} />
        </section>
    );
}

// Komponen baru untuk tombol filter
function DateRangeFilter({ selectedRange, onSelectRange }: { selectedRange: DateRange, onSelectRange: (range: DateRange) => void }) {
    const ranges: { id: DateRange; label: string }[] = [
        { id: 'all', label: 'Semua Waktu' },
        { id: 'today', label: 'Hari Ini' },
        { id: '7d', label: '7 Hari Terakhir' },
        { id: 'thisMonth', label: 'Bulan Ini' },
        { id: '30d', label: '30 Hari Terakhir' },
    ];

    return (
        <div className="flex flex-wrap items-center gap-2 mb-6">
            {ranges.map(range => (
                <button
                    key={range.id}
                    onClick={() => onSelectRange(range.id)}
                    className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                        selectedRange === range.id
                            ? 'unity-gradient-bg text-white shadow-sm'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700'
                    }`}
                >
                    {range.label}
                </button>
            ))}
        </div>
    );
}

// Komponen Kerangka Pemuatan untuk Dashboard
function DashboardSkeleton() {
    return (
        <section>
            <div className="flex items-center space-x-2 mb-6">
                <Skeleton className="h-9 w-28 rounded-lg" />
                <Skeleton className="h-9 w-24 rounded-lg" />
                <Skeleton className="h-9 w-32 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
            <Skeleton className="h-96" />
        </section>
    );
}

// Komponen Grafik Performa, sekarang menerima data sebagai prop
function PerformanceChart({ rekapData }: { rekapData: any[] }) {
    const { data } = useContext(AppContext) as AppContextType;
    const [metric, setMetric] = useState('duration');

    const chartData = {
        labels: data.hosts.map(h => h.nama_host),
        datasets: [
            {
                label: metric === 'duration' ? 'Total Durasi (Jam)' : 'Total Diamond',
                data: data.hosts.map(host => {
                    // Menggunakan data rekap yang sudah disaring dari prop
                    const hostRekap = rekapData.filter(r => r.host_id === host.id);
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

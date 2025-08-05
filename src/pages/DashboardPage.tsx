import { useContext, useState, useMemo } from 'react';
import { AppContext, AppContextType } from '../App';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import Skeleton from '../components/Skeleton';
import { Clock, BarChart, Gem, Crown, ArrowUpDown, Sparkles } from 'lucide-react';

// Registrasi komponen Chart.js yang dibutuhkan
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

// Tipe data untuk rentang waktu dan data performa
type DateRange = 'all' | 'today' | '7d' | 'thisMonth' | '30d';
interface HostPerformance {
    id: number;
    nama_host: string;
    totalMinutes: number;
    totalDiamonds: number;
    totalSessions: number;
    efficiency: number;
}

// Komponen ini adalah halaman utama Dashboard.
export default function DashboardPage() {
    const { data } = useContext(AppContext) as AppContextType;
    const [dateRange, setDateRange] = useState<DateRange>('30d');

    // Logika untuk menyaring data rekap
    const filteredRekap = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (!data.rekapLive) return [];
        switch (dateRange) {
            case 'today':
                return data.rekapLive.filter(r => new Date(r.tanggal_live).setHours(0,0,0,0) === today.getTime());
            case '7d':
                const last7Days = new Date(today);
                last7Days.setDate(today.getDate() - 6);
                return data.rekapLive.filter(r => new Date(r.tanggal_live) >= last7Days);
            case 'thisMonth':
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                return data.rekapLive.filter(r => new Date(r.tanggal_live) >= startOfMonth);
            case '30d':
                 const last30Days = new Date(today);
                last30Days.setDate(today.getDate() - 29);
                return data.rekapLive.filter(r => new Date(r.tanggal_live) >= last30Days);
            default:
                return data.rekapLive;
        }
    }, [data.rekapLive, dateRange]);

    // Logika untuk menghitung statistik dinamis
    const dynamicStats = useMemo(() => {
        if (filteredRekap.length === 0) return { totalMinutes: 0, totalDiamonds: 0, totalSessions: 0, agencyEfficiency: 0, mostActiveHost: 'N/A' };
        const totalMinutes = filteredRekap.reduce((sum, r) => sum + r.durasi_menit, 0);
        const totalDiamonds = filteredRekap.reduce((sum, r) => sum + r.pendapatan, 0);
        const totalHours = totalMinutes / 60;
        const agencyEfficiency = totalHours > 0 ? Math.round(totalDiamonds / totalHours) : 0;
        const hostHours = data.hosts.reduce((acc, host) => {
            acc[host.id] = filteredRekap.filter(r => r.host_id === host.id).reduce((sum, r) => sum + r.durasi_menit, 0);
            return acc;
        }, {} as Record<number, number>);
        const mostActiveHostId = Object.keys(hostHours).reduce((a, b) => hostHours[parseInt(a)] > hostHours[parseInt(b)] ? a : b, '0');
        const mostActiveHostData = data.hosts.find(h => h.id === parseInt(mostActiveHostId));
        return { totalMinutes, totalDiamonds, totalSessions: filteredRekap.length, agencyEfficiency, mostActiveHost: mostActiveHostData ? mostActiveHostData.nama_host : 'N/A' };
    }, [filteredRekap, data.hosts]);

    if (data.loading) {
        return <DashboardSkeleton />;
    }

    const formatDiamond = (num: number) => new Intl.NumberFormat().format(num);
    const formatDuration = (minutes: number) => `${Math.floor(minutes / 60)}j ${minutes % 60}m`;
    
    const kpiData = [
        { title: 'Total Host Aktif', value: data.hosts.filter(h => h.status === 'Aktif').length, icon: Gem },
        { title: 'Total Jam Live', value: formatDuration(dynamicStats.totalMinutes), icon: Clock },
        { title: 'Total Diamond', value: `${formatDiamond(dynamicStats.totalDiamonds)} 💎`, icon: Gem },
    ];
    
    const dynamicKpiData = [
        { title: 'Efisiensi Agensi', value: `${formatDiamond(dynamicStats.agencyEfficiency)} 💎/jam`, icon: BarChart },
        { title: 'Total Sesi Live', value: dynamicStats.totalSessions.toLocaleString(), icon: Clock },
        { title: 'Host Paling Aktif', value: dynamicStats.mostActiveHost, icon: Crown },
    ];
    
    return (
        <section>
            <DateRangeFilter selectedRange={dateRange} onSelectRange={setDateRange} />
            
            {/* --- KARTU ANALISIS CERDAS BARU --- */}
            <GeminiAnalysisCard filteredRekap={filteredRekap} hosts={data.hosts} dateRange={dateRange} />
            {/* ---------------------------------- */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {kpiData.map((kpi) => (
                    <div key={kpi.title} className="bg-white dark:bg-stone-800 p-6 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700">
                        <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400">{kpi.title}</h3>
                        <p className="text-3xl font-bold mt-2 text-stone-900 dark:text-white">{kpi.value}</p>
                    </div>
                ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {dynamicKpiData.map((kpi) => (
                    <div key={kpi.title} className="bg-white dark:bg-stone-800 p-6 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 flex items-center">
                        <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/50 mr-4">
                            <kpi.icon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400">{kpi.title}</h3>
                            <p className="text-xl font-bold text-stone-900 dark:text-white truncate">{kpi.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8">
                <AgencyTrendChart rekapData={filteredRekap} />
            </div>

            <div className="mt-8">
                <HostPerformanceTable rekapData={filteredRekap} hosts={data.hosts} />
            </div>
        </section>
    );
}

// Komponen filter waktu
function DateRangeFilter({ selectedRange, onSelectRange }: { selectedRange: DateRange, onSelectRange: (range: DateRange) => void }) {
    const ranges: { id: DateRange; label: string }[] = [ { id: 'all', label: 'Semua Waktu' }, { id: 'today', label: 'Hari Ini' }, { id: '7d', label: '7 Hari Terakhir' }, { id: 'thisMonth', label: 'Bulan Ini' }, { id: '30d', label: '30 Hari Terakhir' }];
    return (
        <div className="flex flex-wrap items-center gap-2 mb-6">
            {ranges.map(range => ( <button key={range.id} onClick={() => onSelectRange(range.id)} className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${ selectedRange === range.id ? 'unity-gradient-bg text-white shadow-sm' : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700' }`}>{range.label}</button>))}
        </div>
    );
}

// --- KOMPONEN BARU UNTUK ANALISIS CERDAS ---
function GeminiAnalysisCard({ filteredRekap, hosts, dateRange }: { filteredRekap: any[], hosts: any[], dateRange: string }) {
    const [analysis, setAnalysis] = useState('');
    const [loading, setLoading] = useState(false);

    const generateAnalysis = async () => {
        setLoading(true);
        setAnalysis('');

        // 1. Siapkan data untuk dikirim
        const performanceData = hosts.map(host => {
            const hostRekap = filteredRekap.filter(r => r.host_id === host.id);
            const totalMinutes = hostRekap.reduce((sum, r) => sum + r.durasi_menit, 0);
            const totalDiamonds = hostRekap.reduce((sum, r) => sum + r.pendapatan, 0);
            return {
                nama_host: host.nama_host,
                total_jam: (totalMinutes / 60).toFixed(1),
                total_diamond: totalDiamonds,
                jumlah_sesi: hostRekap.length,
            };
        });

        // 2. Buat prompt untuk Gemini
        const prompt = `
            Anda adalah seorang manajer agensi TikTok yang ahli. Berdasarkan data kinerja berikut dalam format JSON untuk periode "${dateRange}", berikan analisis cerdas dalam format Markdown:
            
            Data Kinerja:
            ${JSON.stringify(performanceData, null, 2)}

            Tolong berikan:
            - Satu paragraf ringkasan umum.
            - Tiga poin utama (bullet points) yang menyoroti hal-hal penting (misalnya, host terbaik, tren menarik, atau masalah).
            - Satu saran konkret yang bisa ditindaklanjuti untuk meningkatkan kinerja agensi.
        `;

        // 3. Panggil API Gemini
        try {
            let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
            const payload = { contents: chatHistory };
            const apiKey = ""; // Kunci API akan disediakan oleh lingkungan Canvas
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API call failed with status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
                setAnalysis(result.candidates[0].content.parts[0].text);
            } else {
                setAnalysis("Tidak dapat menghasilkan analisis. Coba lagi.");
            }
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            setAnalysis("Terjadi kesalahan saat menghubungi layanan analisis. Periksa konsol untuk detail.");
        } finally {
            setLoading(false);
        }
    };
    
    // Fungsi sederhana untuk merender Markdown dasar
    const renderMarkdown = (text: string) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>')       // Italic
            .replace(/^- (.*?)(\n|$)/gm, '<li class="ml-4 list-disc">$1</li>'); // Bullet points
    };

    return (
        <div className="mb-8 bg-white dark:bg-stone-800 p-6 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-semibold">Analisis Cerdas</h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Dapatkan wawasan instan tentang kinerja agensi Anda dengan bantuan AI.</p>
                </div>
                <button 
                    onClick={generateAnalysis}
                    disabled={loading}
                    className="unity-gradient-bg text-white font-semibold px-4 py-2 rounded-lg shadow-sm hover:opacity-90 flex items-center disabled:opacity-75"
                >
                    <Sparkles className={`h-5 w-5 mr-2 ${loading ? 'animate-pulse' : ''}`} />
                    {loading ? 'Menganalisis...' : 'Buat Ringkasan'}
                </button>
            </div>
            {analysis && (
                <div className="mt-4 pt-4 border-t dark:border-stone-700 prose prose-sm dark:prose-invert max-w-none"
                     dangerouslySetInnerHTML={{ __html: renderMarkdown(analysis) }} />
            )}
        </div>
    );
}

// Komponen kerangka pemuatan
function DashboardSkeleton() {
    return (
        <section>
            <div className="flex items-center space-x-2 mb-6"><Skeleton className="h-9 w-28 rounded-lg" /><Skeleton className="h-9 w-24 rounded-lg" /><Skeleton className="h-9 w-32 rounded-lg" /></div>
            <Skeleton className="h-48 mb-8" /> {/* Skeleton untuk kartu Gemini */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
            <Skeleton className="h-96" />
            <div className="mt-8"><Skeleton className="h-96" /></div>
        </section>
    );
}

// Komponen grafik tren agensi
function AgencyTrendChart({ rekapData }: { rekapData: any[] }) {
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
    const chartData = { labels: trendData.labels, datasets: [{ label: 'Total Diamond per Hari', data: trendData.data, fill: true, borderColor: 'rgb(75, 192, 192)', backgroundColor: 'rgba(75, 192, 192, 0.2)', tension: 0.1 }]};
    return (
        <div className="bg-white dark:bg-stone-800 p-6 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700">
            <h2 className="text-xl font-semibold mb-4">Tren Kinerja Agensi</h2>
            <div className="relative h-80"><Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} /></div>
        </div>
    );
}

// Komponen tabel performa host
function HostPerformanceTable({ rekapData, hosts }: { rekapData: any[], hosts: any[] }) {
    const [sortConfig, setSortConfig] = useState<{ key: keyof HostPerformance; direction: 'asc' | 'desc' }>({ key: 'totalDiamonds', direction: 'desc' });
    const performanceData = useMemo(() => {
        return hosts.map(host => {
            const hostRekap = rekapData.filter(r => r.host_id === host.id);
            const totalMinutes = hostRekap.reduce((sum, r) => sum + r.durasi_menit, 0);
            const totalDiamonds = hostRekap.reduce((sum, r) => sum + r.pendapatan, 0);
            const totalHours = totalMinutes / 60;
            return { id: host.id, nama_host: host.nama_host, totalMinutes, totalDiamonds, totalSessions: hostRekap.length, efficiency: totalHours > 0 ? Math.round(totalDiamonds / totalHours) : 0 };
        });
    }, [rekapData, hosts]);
    const sortedPerformanceData = useMemo(() => {
        return [...performanceData].sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [performanceData, sortConfig]);
    const handleSort = (key: keyof HostPerformance) => {
        setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));
    };
    const SortableHeader = ({ tKey, tLabel }: { tKey: keyof HostPerformance, tLabel: string }) => (
        <th scope="col" className="px-6 py-3 cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-700" onClick={() => handleSort(tKey)}>
            <div className="flex items-center">{tLabel}{sortConfig.key === tKey && <ArrowUpDown className="ml-2 h-4 w-4" />}</div>
        </th>
    );
    const formatDiamond = (num: number) => new Intl.NumberFormat().format(num);
    const formatDuration = (minutes: number) => `${Math.floor(minutes / 60)}j ${minutes % 60}m`;
    return (
        <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 overflow-x-auto">
            <h2 className="text-xl font-semibold p-6">Tabel Performa Host</h2>
            <table className="w-full text-sm text-left text-stone-600 dark:text-stone-300">
                <thead className="text-xs text-stone-700 dark:text-stone-400 uppercase bg-stone-100 dark:bg-stone-700">
                    <tr>
                        <th scope="col" className="px-6 py-3">Peringkat</th>
                        <SortableHeader tKey="nama_host" tLabel="Nama Host" />
                        <SortableHeader tKey="totalMinutes" tLabel="Total Jam Live" />
                        <SortableHeader tKey="totalDiamonds" tLabel="Total Diamond" />
                        <SortableHeader tKey="efficiency" tLabel="Efisiensi (💎/jam)" />
                        <SortableHeader tKey="totalSessions" tLabel="Jumlah Sesi" />
                    </tr>
                </thead>
                <tbody>
                    {sortedPerformanceData.map((host, index) => (
                        <tr key={host.id} className="bg-white dark:bg-stone-800 border-b dark:border-stone-700">
                            <td className="px-6 py-4 font-medium text-stone-900 dark:text-white text-center">{index + 1}</td>
                            <td className="px-6 py-4 font-medium text-stone-900 dark:text-white">{host.nama_host}</td>
                            <td className="px-6 py-4">{formatDuration(host.totalMinutes)}</td>
                            <td className="px-6 py-4">{formatDiamond(host.totalDiamonds)}</td>
                            <td className="px-6 py-4">{formatDiamond(host.efficiency)}</td>
                            <td className="px-6 py-4">{host.totalSessions}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

import { useContext, useState, useMemo } from 'react';
import { AppContext, AppContextType } from '../App';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Clock, BarChart, Gem, Crown, Trophy } from 'lucide-react';
import { marked } from 'marked';
import { motion } from 'framer-motion';

// Impor custom hook
import { useFilteredRekap } from '../hooks/useFilteredRekap';

// Impor komponen
import DateRangeFilter from '../components/dashboard/DateRangeFilter';
import GeminiAnalysisCard from '../components/dashboard/GeminiAnalysisCard';
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton';
import AgencyTrendChart from '../components/dashboard/AgencyTrendChart';
import HostPerformanceTable, { HostPerformance } from '../components/dashboard/HostPerformanceTable';
import FeedbackModal from '../components/dashboard/FeedbackModal';
import TargetProgressWidget from '../components/dashboard/TargetProgressWidget';
import RecentSessionsTable from '../components/dashboard/RecentSessionsTable';
import AnimatedCard from '../components/dashboard/AnimatedCard';

// Konfigurasi Marked.js
marked.setOptions({
    gfm: true,
    breaks: true,
});

// Registrasi komponen Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Tipe data
type DateRange = 'all' | 'today' | '7d' | 'thisMonth' | '30d';

// Varian untuk container animasi
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Komponen utama Dashboard
export default function DashboardPage() {
    const { data, session } = useContext(AppContext) as AppContextType;
    
    if (data.loading || !session || typeof session.user.user_metadata.role === 'undefined') {
        return <DashboardSkeleton />;
    }

    const userRole = session.user.user_metadata.role;

    if (userRole === 'host') {
        return <HostDashboard />;
    } else {
        return <SuperadminDashboard />;
    }
}

// ==================================================================
// TAMPILAN DASHBOARD UNTUK SUPERADMIN (DESAIN BARU)
// ==================================================================
function SuperadminDashboard() {
    const { data } = useContext(AppContext) as AppContextType;
    const [dateRange, setDateRange] = useState<DateRange>('30d');
    const [feedbackState, setFeedbackState] = useState<{ isOpen: boolean; host: HostPerformance | null }>({ isOpen: false, host: null });

    const approvedRekap = useMemo(() => {
        return data.rekapLive.filter(r => r.status === 'approved');
    }, [data.rekapLive]);

    const filteredRekap = useFilteredRekap(approvedRekap, dateRange);

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

    const formatDiamond = (num: number) => new Intl.NumberFormat().format(num);
    const formatDuration = (minutes: number) => `${Math.floor(minutes / 60)}j ${minutes % 60}m`;
    
    const kpiData = [
        { title: 'Total Host Aktif', value: data.hosts.filter(h => h.status === 'Aktif').length, icon: Gem, shout: 'ACTIVE!' },
        { title: 'Total Jam Live', value: formatDuration(dynamicStats.totalMinutes), icon: Clock, shout: 'TIRELESS!' },
        { title: 'Total Diamond', value: `${formatDiamond(dynamicStats.totalDiamonds)} 💎`, icon: Gem, shout: 'RICH!' },
        { title: 'Efisiensi Agensi', value: `${formatDiamond(dynamicStats.agencyEfficiency)} 💎/jam`, icon: BarChart, shout: 'BOOM!' },
        { title: 'Total Sesi Live', value: dynamicStats.totalSessions.toLocaleString(), icon: Clock, shout: 'NONSTOP!' },
        { title: 'Host Paling Aktif', value: dynamicStats.mostActiveHost, icon: Crown, shout: 'CROWN!' },
    ];
    
    return (
        <section>
            {/* Premium Welcoming Hero Banner with Dashboard Mascot */}
            <div className="flex flex-col md:flex-row gap-6 mb-8 items-stretch justify-between relative overflow-hidden bg-white dark:bg-stone-900 p-6 rounded-2xl border-[3px] border-stone-900 dark:border-stone-100 shadow-[6px_6px_0px_0px_#ec4899] dark:shadow-[6px_6px_0px_0px_#06b6d4] manga-screentone transition-all duration-300">
                <div className="flex-1 flex flex-col justify-between z-10">
                    <div>
                        <h2 className="text-3xl font-extrabold text-stone-900 dark:text-white bangers-font tracking-wider">
                            PUSAT KOMANDO AGENSI ( •̀ ω •́)y
                        </h2>
                        <p className="text-sm font-bold text-stone-500 dark:text-stone-400 mt-2 max-w-xl">
                            Kelola performa agensi secara keseluruhan, pantau pencapaian diamond para host, dan dapatkan analisis cerdas bertenaga AI secara instan!
                        </p>
                    </div>
                    
                    <div className="mt-6 -mb-6">
                        <DateRangeFilter selectedRange={dateRange} onSelectRange={setDateRange} />
                    </div>
                </div>
                
                {/* Large floating anime character sticker - Circular Comic Medallion */}
                <div className="hidden md:flex items-center justify-center shrink-0 w-36 h-36 relative -my-2 -mr-2 rounded-full overflow-hidden border-[3px] border-stone-900 dark:border-stone-100 bg-white dark:bg-stone-800 shadow-[4px_4px_0px_0px_#ec4899] dark:shadow-[4px_4px_0px_0px_#06b6d4] select-none pointer-events-none z-10 animate-float-slow">
                    <img 
                        src="/dashboard_mascot.png" 
                        alt="Dashboard Mascot" 
                        className="w-full h-full object-cover rounded-full"
                    />
                </div>
            </div>

            <GeminiAnalysisCard filteredRekap={filteredRekap} hosts={data.hosts} dateRange={dateRange} />
            
            <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {kpiData.map((kpi) => ( 
                    <AnimatedCard key={kpi.title}>
                        <div className="bg-white dark:bg-stone-900 p-6 rounded-xl h-full manga-panel-interactive relative group">
                            {/* Comic Pop-Up Hover Shout Badge */}
                            <div className="absolute -top-3.5 -right-2 bg-yellow-400 border-2 border-stone-900 text-stone-900 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded shadow-[2px_2px_0px_#000] rotate-12 scale-0 group-hover:scale-100 transition-all duration-300 origin-bottom-left bangers-font text-xs tracking-wider z-20 select-none">
                                {kpi.shout}
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg unity-gradient-bg border-2 border-stone-900 dark:border-stone-100 shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] shrink-0">
                                    <kpi.icon className="h-6 w-6 text-white" />
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="text-xs font-extrabold text-stone-500 dark:text-stone-400 uppercase tracking-wider">{kpi.title}</h3>
                                    <p className="text-xl font-extrabold text-stone-800 dark:text-white truncate mt-1">{kpi.value}</p>
                                </div>
                            </div>
                        </div>
                    </AnimatedCard>
                ))}
            </motion.div>

            <div className="mt-8"><AgencyTrendChart rekapData={filteredRekap} /></div>
            <div className="mt-8"><HostPerformanceTable rekapData={filteredRekap} hosts={data.hosts} onGetFeedback={(host) => setFeedbackState({ isOpen: true, host })}/></div>
            {feedbackState.isOpen && (<FeedbackModal isOpen={feedbackState.isOpen} onClose={() => setFeedbackState({ isOpen: false, host: null })} hostData={feedbackState.host} dateRange={dateRange}/>)}
        </section>
    );
}

// ==================================================================
// TAMPILAN DASHBOARD UNTUK HOST (DESAIN BARU)
// ==================================================================
function HostDashboard() {
    const { data, session } = useContext(AppContext) as AppContextType;
    const [dateRange, setDateRange] = useState<DateRange>('30d');

    const hostId = session?.user.user_metadata.host_id;
    const currentHost = useMemo(() => {
        return data.hosts.find(h => h.id === hostId);
    }, [data.hosts, hostId]);

    const approvedRekap = useMemo(() => {
        if (!hostId || !data.rekapLive) return [];
        return data.rekapLive.filter(r => r.host_id === hostId && r.status === 'approved');
    }, [data.rekapLive, hostId]);

    const filteredRekap = useFilteredRekap(approvedRekap, dateRange);

    const personalStats = useMemo(() => {
        if (!hostId || !data.rekapLive) return { totalMinutes: 0, totalDiamonds: 0, efficiency: 0, rank: 'N/A' };
        
        const totalMinutes = filteredRekap.reduce((sum, r) => sum + r.durasi_menit, 0);
        const totalDiamonds = filteredRekap.reduce((sum, r) => sum + r.pendapatan, 0);
        const totalHours = totalMinutes / 60;
        const efficiency = totalHours > 0 ? Math.round(totalDiamonds / totalHours) : 0;

        const allApprovedRekap = data.rekapLive.filter(r => r.status === 'approved');
        const hostTotals = data.hosts.map(host => {
            const hostAllTimeRekap = allApprovedRekap.filter(r => r.host_id === host.id);
            return { id: host.id, totalDiamonds: hostAllTimeRekap.reduce((sum, r) => sum + r.pendapatan, 0) };
        });
        hostTotals.sort((a, b) => b.totalDiamonds - a.totalDiamonds);
        const rank = hostTotals.findIndex(h => h.id === hostId) + 1;

        return { totalMinutes, totalDiamonds, efficiency, rank: rank > 0 ? `#${rank}` : 'N/A' };
    }, [filteredRekap, hostId, data.hosts, data.rekapLive]);

    const formatDiamond = (num: number) => new Intl.NumberFormat().format(num);
    const formatDuration = (minutes: number) => `${Math.floor(minutes / 60)}j ${minutes % 60}m`;

    const kpiData = [
        { title: 'Total Diamond Anda', value: `${formatDiamond(personalStats.totalDiamonds)} `, icon: Gem, shout: 'RICH!' },
        { title: 'Total Jam Live Anda', value: formatDuration(personalStats.totalMinutes), icon: Clock, shout: 'ACTIVE!' },
        { title: 'Efisiensi Anda', value: `${formatDiamond(personalStats.efficiency)} 💎/jam`, icon: BarChart, shout: 'SUPER!' },
        { title: 'Peringkat Anda', value: personalStats.rank, icon: Trophy, shout: 'CROWN!' },
    ];

    return (
        <section>
            {/* Premium Welcoming Hero Banner with Dashboard Mascot */}
            <div className="flex flex-col md:flex-row gap-6 mb-8 items-stretch justify-between relative overflow-hidden bg-white dark:bg-stone-900 p-6 rounded-2xl border-[3px] border-stone-900 dark:border-stone-100 shadow-[6px_6px_0px_0px_#ec4899] dark:shadow-[6px_6px_0px_0px_#06b6d4] manga-screentone transition-all duration-300">
                <div className="flex-1 flex flex-col justify-between z-10">
                    <div>
                        <h2 className="text-3xl font-extrabold text-stone-900 dark:text-white bangers-font tracking-wider">
                            RUANG KERJA LIVE SENPAI (≧◡≦)
                        </h2>
                        <p className="text-sm font-bold text-stone-500 dark:text-stone-400 mt-2 max-w-xl">
                            Pantau perolehan diamond harian Anda, capai target bulanan, dan tinjau performa streaming Anda dengan bantuan asisten cerdas AI.
                        </p>
                    </div>
                    
                    <div className="mt-6 -mb-6">
                        <DateRangeFilter selectedRange={dateRange} onSelectRange={setDateRange} />
                    </div>
                </div>
                
                {/* Large floating anime character sticker - Circular Comic Medallion */}
                <div className="hidden md:flex items-center justify-center shrink-0 w-36 h-36 relative -my-2 -mr-2 rounded-full overflow-hidden border-[3px] border-stone-900 dark:border-stone-100 bg-white dark:bg-stone-800 shadow-[4px_4px_0px_0px_#ec4899] dark:shadow-[4px_4px_0px_0px_#06b6d4] select-none pointer-events-none z-10 animate-float-slow">
                    <img 
                        src="/dashboard_mascot.png" 
                        alt="Dashboard Mascot" 
                        className="w-full h-full object-cover rounded-full"
                    />
                </div>
            </div>
            
            {currentHost && <div className="mb-8"><TargetProgressWidget host={currentHost} rekapData={data.rekapLive} /></div>}

            <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {kpiData.map((kpi) => (
                    <AnimatedCard key={kpi.title}>
                        <div className="bg-white dark:bg-stone-900 p-6 rounded-xl h-full manga-panel-interactive relative group">
                            {/* Comic Pop-Up Hover Shout Badge */}
                            <div className="absolute -top-3.5 -right-2 bg-yellow-400 border-2 border-stone-900 text-stone-900 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded shadow-[2px_2px_0px_#000] rotate-12 scale-0 group-hover:scale-100 transition-all duration-300 origin-bottom-left bangers-font text-xs tracking-wider z-20 select-none">
                                {kpi.shout}
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg unity-gradient-bg border-2 border-stone-900 dark:border-stone-100 shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] shrink-0">
                                    <kpi.icon className="h-6 w-6 text-white" />
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="text-xs font-extrabold text-stone-500 dark:text-stone-400 uppercase tracking-wider">{kpi.title}</h3>
                                    <p className="text-xl font-extrabold text-stone-800 dark:text-white truncate mt-1">{kpi.value}</p>
                                </div>
                            </div>
                        </div>
                    </AnimatedCard>
                ))}
            </motion.div>
            <div className="mt-8">
                <AgencyTrendChart rekapData={filteredRekap} />
            </div>
             <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4 text-stone-800 dark:text-white">5 Sesi Live Terakhir Anda (Disetujui)</h2>
                <RecentSessionsTable rekapData={filteredRekap.slice(0, 5)} />
            </div>
        </section>
    );
}

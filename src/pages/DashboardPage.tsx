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
        { title: 'Total Host Aktif', value: data.hosts.filter(h => h.status === 'Aktif').length, icon: Gem },
        { title: 'Total Jam Live', value: formatDuration(dynamicStats.totalMinutes), icon: Clock },
        { title: 'Total Diamond', value: `${formatDiamond(dynamicStats.totalDiamonds)} 💎`, icon: Gem },
        { title: 'Efisiensi Agensi', value: `${formatDiamond(dynamicStats.agencyEfficiency)} 💎/jam`, icon: BarChart },
        { title: 'Total Sesi Live', value: dynamicStats.totalSessions.toLocaleString(), icon: Clock },
        { title: 'Host Paling Aktif', value: dynamicStats.mostActiveHost, icon: Crown },
    ];
    
    return (
        <section>
            <DateRangeFilter selectedRange={dateRange} onSelectRange={setDateRange} />
            <GeminiAnalysisCard filteredRekap={filteredRekap} hosts={data.hosts} dateRange={dateRange} />
            
            <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {kpiData.map((kpi) => ( 
                    <AnimatedCard key={kpi.title}>
                        <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm p-6 rounded-xl border border-purple-300 dark:border-cyan-400/30 shadow-lg h-full">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg unity-gradient-bg">
                                    <kpi.icon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400">{kpi.title}</h3>
                                    <p className="text-2xl font-bold text-stone-800 dark:text-white truncate">{kpi.value}</p>
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
        { title: 'Total Diamond Anda', value: `${formatDiamond(personalStats.totalDiamonds)} `, icon: Gem },
        { title: 'Total Jam Live Anda', value: formatDuration(personalStats.totalMinutes), icon: Clock },
        { title: 'Efisiensi Anda', value: `${formatDiamond(personalStats.efficiency)} 💎/jam`, icon: BarChart },
        { title: 'Peringkat Anda', value: personalStats.rank, icon: Trophy },
    ];

    return (
        <section>
            <DateRangeFilter selectedRange={dateRange} onSelectRange={setDateRange} />
            
            {currentHost && <div className="mb-8"><TargetProgressWidget host={currentHost} rekapData={data.rekapLive} /></div>}

            <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {kpiData.map((kpi) => (
                    <AnimatedCard key={kpi.title}>
                        <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm p-6 rounded-xl border border-purple-300 dark:border-cyan-400/30 shadow-lg h-full">
                           <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg unity-gradient-bg">
                                    <kpi.icon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400">{kpi.title}</h3>
                                    <p className="text-2xl font-bold text-stone-800 dark:text-white truncate">{kpi.value}</p>
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

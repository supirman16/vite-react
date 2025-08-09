import { useContext, useState, useMemo, useEffect } from 'react';
import { AppContext, AppContextType, supabase } from '../App';
import { Trophy, ArrowUpCircle, Award } from 'lucide-react';
import Skeleton from '../components/Skeleton';
import { motion } from 'framer-motion';

// Tipe data untuk rentang waktu dan data peringkat
type DateRange = 'all' | 'thisWeek' | 'thisMonth';
interface LeaderboardEntry {
    id: number;
    nama_host: string;
    totalDiamonds: number;
    rank: number;
}

// Komponen utama Papan Peringkat
export default function LeaderboardPage() {
    const { data, session } = useContext(AppContext) as AppContextType;

    if (data.loading || !session) {
        return <LeaderboardSkeleton />;
    }

    const isSuperAdmin = session.user.user_metadata?.role === 'superadmin';

    return (
        <section>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <h2 className="text-2xl font-bold tracking-wider text-stone-800 dark:text-white uppercase" style={{ textShadow: '0 0 8px rgba(192, 132, 252, 0.3)' }}>
                    {isSuperAdmin ? 'Leaderboard Agensi' : 'Arena Kompetisi'}
                </h2>
            </div>
            {isSuperAdmin ? <SuperadminLeaderboard /> : <HostLeaderboard />}
        </section>
    );
}

// ==================================================================
// TAMPILAN PAPAN PERINGKAT UNTUK SUPERADMIN (DESAIN BARU)
// ==================================================================
function SuperadminLeaderboard() {
    const { data } = useContext(AppContext) as AppContextType;
    const [dateRange, setDateRange] = useState<DateRange>('all');

    const leaderboardData = useMemo(() => {
        return calculateLeaderboard(data.hosts, data.rekapLive, dateRange);
    }, [data.hosts, data.rekapLive, dateRange]);

    const top3 = leaderboardData.slice(0, 3);
    const others = leaderboardData.slice(3);

    return (
        <>
            <DateRangeFilter selectedRange={dateRange} onSelectRange={setDateRange} />
            
            <Top3Showcase hosts={top3} />

            <div className="mt-8 bg-white dark:bg-stone-900/50 backdrop-blur-sm rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
                <table className="w-full text-sm text-left text-stone-600 dark:text-stone-300">
                    <thead className="text-xs text-purple-600 dark:text-cyan-400 uppercase bg-stone-100 dark:bg-black/30">
                        <tr>
                            <th scope="col" className="px-6 py-4 text-center">Peringkat</th>
                            <th scope="col" className="px-6 py-4">Nama Host</th>
                            <th scope="col" className="px-6 py-4">Total Diamond (💎)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {others.length > 0 ? others.map((host) => (
                            <tr key={host.id} className="border-b border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors">
                                <td className="px-6 py-4 font-bold text-xl text-stone-800 dark:text-white text-center">{host.rank}</td>
                                <td className="px-6 py-4 font-semibold text-stone-800 dark:text-white">{host.nama_host}</td>
                                <td className="px-6 py-4 font-mono text-lg">{new Intl.NumberFormat().format(host.totalDiamonds)}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={3} className="text-center py-8 text-stone-500">
                                    Tidak ada data peringkat lain untuk ditampilkan.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}


// ==================================================================
// TAMPILAN PAPAN PERINGKAT UNTUK HOST (DESAIN BARU)
// ==================================================================
function HostLeaderboard() {
    const { data, session } = useContext(AppContext) as AppContextType;
    const [dateRange, setDateRange] = useState<DateRange>('all');
    const [allRekapData, setAllRekapData] = useState<any[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAllRekapData = async () => {
            setIsLoading(true);
            const { data: rekapData, error } = await supabase.from('rekap_live').select('*');
            if (error) {
                console.error("Gagal mengambil semua data rekap:", error);
                setAllRekapData([]);
            } else {
                setAllRekapData(rekapData);
            }
            setIsLoading(false);
        };
        fetchAllRekapData();
    }, []);

    const hostId = session?.user.user_metadata.host_id;
    
    const leaderboardData = useMemo(() => {
        if (!allRekapData) return [];
        return calculateLeaderboard(data.hosts, allRekapData, dateRange);
    }, [data.hosts, allRekapData, dateRange]);

    const currentUserRank = useMemo(() => {
        return leaderboardData.find(h => h.id === hostId);
    }, [leaderboardData, hostId]);

    const top3 = leaderboardData.slice(0, 3);
    const others = leaderboardData.slice(3);

    const diamondsToNextRank = useMemo(() => {
        if (!currentUserRank || currentUserRank.rank === 1) return 0;
        const hostAbove = leaderboardData.find(h => h.rank === currentUserRank.rank - 1);
        return hostAbove ? hostAbove.totalDiamonds - currentUserRank.totalDiamonds + 1 : 0;
    }, [currentUserRank, leaderboardData]);

    if (isLoading) {
        return <LeaderboardSkeleton />;
    }

    return (
        <section>
            <DateRangeFilter selectedRange={dateRange} onSelectRange={setDateRange} />

            {currentUserRank && (
                <div className="mb-8 p-6 bg-white dark:bg-stone-900/50 backdrop-blur-sm rounded-xl border border-stone-200 dark:border-stone-700 grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
                    <div className="flex flex-col items-center md:items-start">
                        <p className="text-sm text-stone-500 dark:text-stone-400 uppercase tracking-wider">Peringkat Anda</p>
                        <p className="text-5xl font-bold unity-gradient-text">#{currentUserRank.rank}</p>
                    </div>
                    <div className="flex flex-col items-center md:items-start">
                        <p className="text-sm text-stone-500 dark:text-stone-400 uppercase tracking-wider">Total Diamond</p>
                        <p className="text-3xl font-semibold text-stone-800 dark:text-white">{new Intl.NumberFormat().format(currentUserRank.totalDiamonds)} 💎</p>
                    </div>
                    {currentUserRank.rank > 1 && (
                         <div className="flex flex-col items-center md:items-start">
                            <p className="text-sm text-stone-500 dark:text-stone-400 uppercase tracking-wider">Kejar Peringkat Atas</p>
                            <p className="text-3xl font-semibold text-green-500 dark:text-green-400 flex items-center">
                                <ArrowUpCircle className="h-6 w-6 mr-2"/>
                                {new Intl.NumberFormat().format(diamondsToNextRank)}
                            </p>
                        </div>
                    )}
                </div>
            )}

            <Top3Showcase hosts={top3} />

            <div className="mt-8 bg-white dark:bg-stone-900/50 backdrop-blur-sm rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
                 <table className="w-full text-sm text-left text-stone-600 dark:text-stone-300">
                    <thead className="text-xs text-purple-600 dark:text-cyan-400 uppercase bg-stone-100 dark:bg-black/30">
                        <tr>
                            <th scope="col" className="px-6 py-4 text-center">Peringkat</th>
                            <th scope="col" className="px-6 py-4">Nama Host</th>
                            <th scope="col" className="px-6 py-4">Total Diamond (💎)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {others.map((host) => (
                            <tr key={host.id} className={`border-b border-stone-200 dark:border-stone-800 transition-colors ${host.id === hostId ? 'unity-gradient-bg text-white' : 'hover:bg-stone-50 dark:hover:bg-stone-800/60'}`}>
                                <td className="px-6 py-4 font-bold text-xl text-center">{host.rank}</td>
                                <td className="px-6 py-4 font-semibold">{host.nama_host}</td>
                                <td className="px-6 py-4 font-mono text-lg">{new Intl.NumberFormat().format(host.totalDiamonds)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

// ==================================================================
// KOMPONEN-KOMPONEN PEMBANTU (DESAIN BARU & RESPONSIVE TEMA)
// ==================================================================

function Top3Showcase({ hosts }: { hosts: LeaderboardEntry[] }) {
    const podiumOrder = [1, 0, 2]; // Index untuk juara 2, 1, 3
    const podiumStyles = [
        { rank: 1, color: 'gold', shadow: 'shadow-[0_0_20px_gold]', border: 'border-yellow-400', height: 'mt-0' },
        { rank: 2, color: '#A0A0A0', shadow: 'shadow-[0_0_20px_#C0C0C0]', border: 'border-stone-400', height: 'mt-8' },
        { rank: 3, color: '#CD7F32', shadow: 'shadow-[0_0_20px_#CD7F32]', border: 'border-yellow-600', height: 'mt-12' },
    ];

    const podiumHosts = podiumOrder.map(index => hosts[index]).filter(Boolean);

    return (
        <div className="relative flex justify-center items-end gap-4 px-4 pt-8 min-h-[280px]">
            {podiumHosts.map((host) => {
                const style = podiumStyles.find(s => s.rank === host.rank)!;
                return (
                    <motion.div 
                        key={host.id} 
                        className={`w-1/3 max-w-xs flex flex-col items-center p-4 rounded-t-lg bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm border-2 ${style.border} ${style.height} ${style.shadow}`}
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: (4 - host.rank) * 0.2 }}
                    >
                        <Award size={48} color={style.color} style={{ filter: `drop-shadow(0 0 10px ${style.color})` }} />
                        <h3 className="text-xl font-bold text-stone-800 dark:text-white mt-2 truncate">{host.nama_host}</h3>
                        <p className="font-semibold text-2xl" style={{ color: style.color }}>#{host.rank}</p>
                        <p className="font-mono text-lg text-stone-800 dark:text-white mt-1">{new Intl.NumberFormat().format(host.totalDiamonds)} 💎</p>
                    </motion.div>
                )
            })}
        </div>
    );
}

function DateRangeFilter({ selectedRange, onSelectRange }: { selectedRange: DateRange, onSelectRange: (range: DateRange) => void }) {
    const ranges: { id: DateRange; label: string }[] = [
        { id: 'all', label: 'Semua Waktu' },
        { id: 'thisWeek', label: 'Minggu Ini' },
        { id: 'thisMonth', label: 'Bulan Ini' },
    ];
    return (
        <div className="flex flex-wrap items-center gap-2 mb-6">
            {ranges.map(range => ( <button key={range.id} onClick={() => onSelectRange(range.id)} className={`px-4 py-2 text-sm font-bold rounded-md transition-all duration-200 border-2 border-transparent hover:border-purple-500 dark:hover:border-cyan-400 ${ selectedRange === range.id ? 'unity-gradient-bg text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white' }`}>{range.label}</button>))}
        </div>
    );
}

function calculateLeaderboard(hosts: any[], rekapLive: any[], dateRange: DateRange): LeaderboardEntry[] {
    const now = new Date();
    const approvedRekap = rekapLive.filter(r => r.status === 'approved');
    let filteredRekap = approvedRekap;

    if (dateRange === 'thisWeek') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dayOfWeek = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
        filteredRekap = approvedRekap.filter(r => new Date(r.tanggal_live) >= startOfWeek);
    } else if (dateRange === 'thisMonth') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        filteredRekap = approvedRekap.filter(r => new Date(r.tanggal_live) >= startOfMonth);
    }

    const hostTotals = hosts.map(host => {
        const hostRekap = filteredRekap.filter(r => r.host_id === host.id);
        return {
            id: host.id,
            nama_host: host.nama_host,
            totalDiamonds: hostRekap.reduce((sum, r) => sum + r.pendapatan, 0),
        };
    });

    return hostTotals
        .sort((a, b) => b.totalDiamonds - a.totalDiamonds)
        .map((host, index) => ({ ...host, rank: index + 1 }));
}

function LeaderboardSkeleton() {
    return (
        <section>
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="flex items-center space-x-2 mb-6">
                <Skeleton className="h-9 w-28 rounded-lg" />
                <Skeleton className="h-9 w-24 rounded-lg" />
                <Skeleton className="h-9 w-32 rounded-lg" />
            </div>
            <Skeleton className="h-64" />
            <div className="mt-8">
                <Skeleton className="h-96" />
            </div>
        </section>
    );
}

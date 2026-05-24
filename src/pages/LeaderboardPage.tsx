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

            <div className="mt-8 bg-white dark:bg-stone-900 rounded-xl border-[3px] border-stone-900 dark:border-stone-100 shadow-[5px_5px_0px_0px_#ec4899] dark:shadow-[5px_5px_0px_0px_#06b6d4] overflow-hidden transition-all duration-300">
                <table className="w-full text-sm text-left text-stone-600 dark:text-stone-300">
                    <thead className="text-xs text-stone-900 dark:text-stone-200 uppercase bg-stone-100 dark:bg-stone-800 border-b-[3px] border-stone-900 dark:border-stone-100 font-extrabold">
                        <tr>
                            <th scope="col" className="px-6 py-4 text-center">Peringkat</th>
                            <th scope="col" className="px-6 py-4">Nama Host</th>
                            <th scope="col" className="px-6 py-4">Total Diamond (💎)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {others.length > 0 ? others.map((host) => (
                            <tr key={host.id} className="border-b-2 border-stone-900 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors">
                                <td className="px-6 py-4 font-bold text-xl text-stone-800 dark:text-white text-center">{host.rank}</td>
                                <td className="px-6 py-4 font-extrabold text-stone-800 dark:text-white">{host.nama_host}</td>
                                <td className="px-6 py-4 font-mono text-lg font-bold">{new Intl.NumberFormat().format(host.totalDiamonds)}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={3} className="text-center py-8 text-stone-500 font-bold">
                                    Tidak ada data peringkat lain untuk ditampilkan. (・_・;)
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
                <div className="mb-8 p-6 bg-white dark:bg-stone-900 rounded-2xl border-[3px] border-stone-900 dark:border-stone-100 shadow-[6px_6px_0px_0px_#ec4899] dark:shadow-[6px_6px_0px_0px_#06b6d4] grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left relative overflow-hidden manga-screentone transition-all duration-300">
                    <div className="flex flex-col items-center md:items-start z-10">
                        <p className="text-xs font-extrabold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Peringkat Anda</p>
                        <p className="text-5xl font-extrabold unity-gradient-text bangers-font mt-1">#{currentUserRank.rank}</p>
                    </div>
                    <div className="flex flex-col items-center md:items-start z-10">
                        <p className="text-xs font-extrabold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Total Diamond</p>
                        <p className="text-3xl font-extrabold text-stone-800 dark:text-white mt-1">{new Intl.NumberFormat().format(currentUserRank.totalDiamonds)} 💎</p>
                    </div>
                    {currentUserRank.rank > 1 && (
                         <div className="flex flex-col items-center md:items-start z-10">
                            <p className="text-xs font-extrabold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Kejar Peringkat Atas</p>
                            <p className="text-3xl font-extrabold text-green-500 dark:text-green-400 flex items-center mt-1">
                                <ArrowUpCircle className="h-6 w-6 mr-2 animate-bounce"/>
                                +{new Intl.NumberFormat().format(diamondsToNextRank)} 💎
                            </p>
                        </div>
                    )}
                </div>
            )}

            <Top3Showcase hosts={top3} />

            <div className="mt-8 bg-white dark:bg-stone-900 rounded-xl border-[3px] border-stone-900 dark:border-stone-100 shadow-[5px_5px_0px_0px_#ec4899] dark:shadow-[5px_5px_0px_0px_#06b6d4] overflow-hidden transition-all duration-300">
                 <table className="w-full text-sm text-left text-stone-600 dark:text-stone-300">
                    <thead className="text-xs text-stone-900 dark:text-stone-200 uppercase bg-stone-100 dark:bg-stone-800 border-b-[3px] border-stone-900 dark:border-stone-100 font-extrabold">
                        <tr>
                            <th scope="col" className="px-6 py-4 text-center">Peringkat</th>
                            <th scope="col" className="px-6 py-4">Nama Host</th>
                            <th scope="col" className="px-6 py-4">Total Diamond (💎)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {others.map((host) => (
                            <tr key={host.id} className={`border-b-2 border-stone-900 dark:border-stone-800/50 transition-colors ${host.id === hostId ? 'bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 border-pink-500 dark:border-cyan-400' : 'hover:bg-stone-50 dark:hover:bg-stone-800/60'}`}>
                                <td className={`px-6 py-4 font-bold text-xl text-center ${host.id === hostId ? 'text-pink-600 dark:text-cyan-300' : 'text-stone-800 dark:text-stone-200'}`}>{host.rank}</td>
                                <td className={`px-6 py-4 font-extrabold ${host.id === hostId ? 'text-pink-600 dark:text-cyan-300' : 'text-stone-900 dark:text-white'}`}>{host.nama_host}</td>
                                <td className={`px-6 py-4 font-mono text-lg font-bold ${host.id === hostId ? 'text-pink-600 dark:text-cyan-300' : ''}`}>{new Intl.NumberFormat().format(host.totalDiamonds)}</td>
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
        { rank: 1, color: 'text-yellow-500 dark:text-yellow-400', shadow: 'shadow-[5px_5px_0px_0px_#eab308]', border: 'border-yellow-400', height: 'mt-0 border-[3px] z-10 scale-105', bgClass: 'bg-yellow-50/70 dark:bg-yellow-950/20', badgeBg: 'bg-yellow-400 text-stone-900' },
        { rank: 2, color: 'text-stone-400 dark:text-stone-300', shadow: 'shadow-[4px_4px_0px_0px_#a8a29e]', border: 'border-stone-400', height: 'mt-8 border-[3px]', bgClass: 'bg-stone-50/70 dark:bg-stone-900/40', badgeBg: 'bg-stone-400 text-white' },
        { rank: 3, color: 'text-amber-700 dark:text-amber-500', shadow: 'shadow-[4px_4px_0px_0px_#b45309]', border: 'border-yellow-600', height: 'mt-12 border-[3px]', bgClass: 'bg-amber-50/40 dark:bg-amber-950/10', badgeBg: 'bg-amber-700 text-white' },
    ];

    const podiumHosts = podiumOrder.map(index => hosts[index]).filter(Boolean);

    return (
        <div className="relative flex justify-center items-end gap-4 px-4 pt-10 min-h-[300px] max-w-3xl mx-auto">
            {podiumHosts.map((host) => {
                const style = podiumStyles.find(s => s.rank === host.rank)!;
                return (
                    <motion.div 
                        key={host.id} 
                        className={`w-1/3 max-w-[200px] flex flex-col items-center p-4 rounded-t-2xl border-stone-900 dark:border-stone-100 ${style.border} ${style.height} ${style.shadow} ${style.bgClass} relative overflow-hidden manga-screentone`}
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: (4 - host.rank) * 0.2 }}
                    >
                        {/* Sticker Rank Badge */}
                        <div className={`absolute top-2 right-2 w-8 h-8 rounded-full border-2 border-stone-900 flex items-center justify-center font-extrabold text-xs shadow-[1.5px_1.5px_0px_#000] rotate-12 bangers-font ${style.badgeBg}`}>
                            #{host.rank}
                        </div>

                        <Trophy size={40} className={`${style.color} filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.15)] ${host.rank === 1 ? 'animate-bounce' : ''}`} />
                        <h3 className="text-sm sm:text-base font-extrabold text-stone-900 dark:text-white mt-3 truncate w-full text-center">{host.nama_host}</h3>
                        <p className="font-mono text-xs sm:text-sm font-bold text-stone-600 dark:text-stone-300 mt-1">{new Intl.NumberFormat().format(host.totalDiamonds)} 💎</p>
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
        <div className="flex flex-wrap items-center gap-2 mb-6 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg max-w-md border-2 border-stone-900 dark:border-stone-700">
            {ranges.map(range => ( 
                <button 
                    key={range.id} 
                    onClick={() => onSelectRange(range.id)} 
                    className={`flex-1 py-1.5 px-3 text-xs font-extrabold rounded-md transition-all duration-200 border-2 border-transparent ${ 
                        selectedRange === range.id 
                            ? 'unity-gradient-bg text-white border-stone-900 dark:border-stone-100 shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff]' 
                            : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-transparent' 
                    }`}
                >
                    {range.label}
                </button>
            ))}
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

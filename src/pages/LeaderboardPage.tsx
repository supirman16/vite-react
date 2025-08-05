import { useContext, useState, useMemo, useEffect } from 'react';
import { AppContext, AppContextType, supabase } from '../App'; // Impor supabase
import { Trophy, ArrowUpCircle } from 'lucide-react';
import Skeleton from '../components/Skeleton';

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

    if (isSuperAdmin) {
        return <SuperadminLeaderboard />;
    } else {
        return <HostLeaderboard />;
    }
}

// ==================================================================
// TAMPILAN PAPAN PERINGKAT UNTUK SUPERADMIN
// ==================================================================
function SuperadminLeaderboard() {
    const { data } = useContext(AppContext) as AppContextType;
    const [dateRange, setDateRange] = useState<DateRange>('all');

    const leaderboardData = useMemo(() => {
        return calculateLeaderboard(data.hosts, data.rekapLive, dateRange);
    }, [data.hosts, data.rekapLive, dateRange]);

    return (
        <section>
            <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100 mb-4">Papan Peringkat Agensi</h2>
            <DateRangeFilter selectedRange={dateRange} onSelectRange={setDateRange} />
            <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 overflow-x-auto">
                <table className="w-full text-sm text-left text-stone-600 dark:text-stone-300">
                    <thead className="text-xs text-stone-700 dark:text-stone-400 uppercase bg-stone-100 dark:bg-stone-700">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-center">Peringkat</th>
                            <th scope="col" className="px-6 py-3">Nama Host</th>
                            <th scope="col" className="px-6 py-3">Total Diamond (💎)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaderboardData.map((host) => (
                            <tr key={host.id} className="bg-white dark:bg-stone-800 border-b dark:border-stone-700">
                                <td className="px-6 py-4 font-medium text-stone-900 dark:text-white text-center">{host.rank}</td>
                                <td className="px-6 py-4 font-semibold text-stone-900 dark:text-white">{host.nama_host}</td>
                                <td className="px-6 py-4">{new Intl.NumberFormat().format(host.totalDiamonds)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

// ==================================================================
// TAMPILAN PAPAN PERINGKAT UNTUK HOST
// ==================================================================
function HostLeaderboard() {
    const { data, session } = useContext(AppContext) as AppContextType;
    const [dateRange, setDateRange] = useState<DateRange>('all');
    
    // --- PERBAIKAN: State baru untuk menyimpan semua data rekap ---
    const [allRekapData, setAllRekapData] = useState<any[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Efek untuk mengambil semua data rekap saat komponen dimuat
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

    const currentHostInfo = useMemo(() => {
        return data.hosts.find(h => h.user_id === session?.user.id);
    }, [data.hosts, session]);
    
    const leaderboardData = useMemo(() => {
        if (!allRekapData) return []; // Jangan hitung jika data belum siap
        return calculateLeaderboard(data.hosts, allRekapData, dateRange);
    }, [data.hosts, allRekapData, dateRange]);

    const currentUserRank = useMemo(() => {
        return leaderboardData.find(h => h.id === currentHostInfo?.id);
    }, [leaderboardData, currentHostInfo]);

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
            <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100 mb-4">Arena Kompetisi</h2>
            <DateRangeFilter selectedRange={dateRange} onSelectRange={setDateRange} />

            {currentUserRank && (
                <div className="mb-8 p-6 bg-white dark:bg-stone-800 rounded-xl shadow-lg border border-purple-200 dark:border-purple-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-center md:text-left">
                    <div className="flex flex-col items-center md:items-start">
                        <p className="text-sm text-stone-500 dark:text-stone-400">Peringkat Anda</p>
                        <p className="text-5xl font-bold text-purple-600 dark:text-purple-400">#{currentUserRank.rank}</p>
                    </div>
                    <div className="flex flex-col items-center md:items-start">
                        <p className="text-sm text-stone-500 dark:text-stone-400">Total Diamond Anda</p>
                        <p className="text-3xl font-semibold">{new Intl.NumberFormat().format(currentUserRank.totalDiamonds)} 💎</p>
                    </div>
                    {currentUserRank.rank > 1 && (
                         <div className="flex flex-col items-center md:items-start">
                            <p className="text-sm text-stone-500 dark:text-stone-400">Menuju Peringkat Berikutnya</p>
                            <p className="text-3xl font-semibold text-green-500 flex items-center">
                                <ArrowUpCircle className="h-6 w-6 mr-2"/>
                                {new Intl.NumberFormat().format(diamondsToNextRank)} 💎
                            </p>
                        </div>
                    )}
                </div>
            )}

            <Top3Showcase hosts={top3} />

            <div className="mt-8 bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 overflow-x-auto">
                 <table className="w-full text-sm text-left text-stone-600 dark:text-stone-300">
                    <thead className="text-xs text-stone-700 dark:text-stone-400 uppercase bg-stone-100 dark:bg-stone-700">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-center">Peringkat</th>
                            <th scope="col" className="px-6 py-3">Nama Host</th>
                            <th scope="col" className="px-6 py-3">Total Diamond (💎)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {others.map((host) => (
                            <tr key={host.id} className={`border-b dark:border-stone-700 ${host.id === currentHostInfo?.id ? 'bg-purple-50 dark:bg-purple-900/30' : 'bg-white dark:bg-stone-800'}`}>
                                <td className="px-6 py-4 font-medium text-stone-900 dark:text-white text-center">{host.rank}</td>
                                <td className="px-6 py-4 font-semibold text-stone-900 dark:text-white">{host.nama_host}</td>
                                <td className="px-6 py-4">{new Intl.NumberFormat().format(host.totalDiamonds)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

// Komponen untuk Panggung Juara Top 3
function Top3Showcase({ hosts }: { hosts: LeaderboardEntry[] }) {
    const medalColors = ['text-yellow-400', 'text-stone-400', 'text-yellow-600'];
    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">Panggung Juara</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {hosts.map((host, index) => (
                    <div key={host.id} className={`p-4 rounded-lg text-center bg-stone-50 dark:bg-stone-800/50 border-2 ${index === 0 ? 'border-yellow-400' : index === 1 ? 'border-stone-400' : 'border-yellow-600'}`}>
                        <Trophy className={`h-8 w-8 mx-auto ${medalColors[index]}`} />
                        <p className="font-bold text-lg mt-2">{host.nama_host}</p>
                        <p className="text-sm text-stone-500 dark:text-stone-400">Peringkat #{host.rank}</p>
                        <p className="font-semibold mt-1">{new Intl.NumberFormat().format(host.totalDiamonds)} 💎</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Komponen filter waktu
function DateRangeFilter({ selectedRange, onSelectRange }: { selectedRange: DateRange, onSelectRange: (range: DateRange) => void }) {
    const ranges: { id: DateRange; label: string }[] = [
        { id: 'all', label: 'Semua Waktu' },
        { id: 'thisWeek', label: 'Minggu Ini' },
        { id: 'thisMonth', label: 'Bulan Ini' },
    ];
    return (
        <div className="flex flex-wrap items-center gap-2 mb-6">
            {ranges.map(range => ( <button key={range.id} onClick={() => onSelectRange(range.id)} className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${ selectedRange === range.id ? 'unity-gradient-bg text-white shadow-sm' : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700' }`}>{range.label}</button>))}
        </div>
    );
}

// Fungsi bantuan untuk menghitung data papan peringkat
function calculateLeaderboard(hosts: any[], rekapLive: any[], dateRange: DateRange): LeaderboardEntry[] {
    const now = new Date();
    let filteredRekap = rekapLive;

    if (dateRange === 'thisWeek') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dayOfWeek = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Minggu dimulai hari Senin
        filteredRekap = rekapLive.filter(r => new Date(r.tanggal_live) >= startOfWeek);
    } else if (dateRange === 'thisMonth') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        filteredRekap = rekapLive.filter(r => new Date(r.tanggal_live) >= startOfMonth);
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


// Komponen kerangka pemuatan
function LeaderboardSkeleton() {
    return (
        <section>
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="flex items-center space-x-2 mb-6">
                <Skeleton className="h-9 w-28 rounded-lg" />
                <Skeleton className="h-9 w-24 rounded-lg" />
                <Skeleton className="h-9 w-32 rounded-lg" />
            </div>
            <Skeleton className="h-96" />
        </section>
    );
}

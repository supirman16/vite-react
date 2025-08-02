import { useContext, useState, useMemo } from 'react';
import { AppContext, AppContextType } from '../App';
import { Trophy, Star, Zap } from 'lucide-react';

// Tipe data untuk data peringkat
interface LeaderboardData {
    hostId: number;
    hostName: string;
    totalDiamonds: number;
    totalMinutes: number;
    efficiency: number;
}

// Komponen ini adalah halaman Papan Peringkat (Leaderboard).
export default function LeaderboardPage() {
    const [month, setMonth] = useState(new Date().getMonth());
    const [year, setYear] = useState(new Date().getFullYear());

    const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

    return (
        <section>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100">Papan Peringkat Host</h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Lihat peringkat host berdasarkan performa bulanan.</p>
                </div>
                <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                     <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 dark:bg-stone-700 dark:border-stone-600 dark:placeholder-stone-400 dark:text-white">
                        {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                     </select>
                     <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 dark:bg-stone-700 dark:border-stone-600 dark:placeholder-stone-400 dark:text-white">
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                     </select>
                </div>
            </div>
            <LeaderboardTables month={month} year={year} />
        </section>
    );
}

// Komponen untuk menampilkan semua tabel peringkat
function LeaderboardTables({ month, year }: { month: number, year: number }) {
    const { data } = useContext(AppContext) as AppContextType;

    const leaderboardData: LeaderboardData[] = useMemo(() => {
        return data.hosts
            .filter(host => host.status === 'Aktif') // <-- HANYA HOST AKTIF
            .map(host => {
                const hostRekaps = data.rekapLive.filter(r => {
                    const recDate = new Date(r.tanggal_live);
                    return r.host_id === host.id && recDate.getFullYear() === year && recDate.getMonth() === month && r.status === 'approved';
                });

                const totalMinutes = hostRekaps.reduce((sum, r) => sum + r.durasi_menit, 0);
                const totalDiamonds = hostRekaps.reduce((sum, r) => sum + r.pendapatan, 0);
                const efficiency = totalMinutes > 0 ? totalDiamonds / (totalMinutes / 60) : 0;

                return {
                    hostId: host.id,
                    hostName: host.nama_host,
                    totalDiamonds,
                    totalMinutes,
                    efficiency,
                };
            });
    }, [data.hosts, data.rekapLive, month, year]);

    const topByDiamonds = [...leaderboardData].sort((a, b) => b.totalDiamonds - a.totalDiamonds).slice(0, 10);
    const topByHours = [...leaderboardData].sort((a, b) => b.totalMinutes - a.totalMinutes).slice(0, 10);
    const topByEfficiency = [...leaderboardData].sort((a, b) => b.efficiency - a.efficiency).slice(0, 10);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <RankingCard title="Top Diamond" icon={Trophy} data={topByDiamonds} valueKey="totalDiamonds" unit="💎" />
            <RankingCard title="Top Jam Live" icon={Star} data={topByHours} valueKey="totalMinutes" isDuration />
            <RankingCard title="Top Efisiensi" icon={Zap} data={topByEfficiency} valueKey="efficiency" unit="💎/jam" />
        </div>
    );
}

// Komponen kartu peringkat individual
function RankingCard({ title, icon: Icon, data, valueKey, unit, isDuration }: { title: string, icon: React.ElementType, data: LeaderboardData[], valueKey: keyof LeaderboardData, unit?: string, isDuration?: boolean }) {
    const formatValue = (value: number) => {
        if (isDuration) {
            const hours = Math.floor(value / 60);
            const minutes = value % 60;
            return `${hours}j ${minutes}m`;
        }
        return `${new Intl.NumberFormat().format(Math.round(value))} ${unit || ''}`;
    };

    const getMedalColor = (index: number) => {
        if (index === 0) return 'text-yellow-400';
        if (index === 1) return 'text-stone-400';
        if (index === 2) return 'text-yellow-600';
        return 'text-stone-500';
    };

    return (
        <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-6">
            <div className="flex items-center mb-4">
                <Icon className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-3" />
                <h3 className="text-lg font-semibold">{title}</h3>
            </div>
            <ul className="space-y-3">
                {data.map((item, index) => (
                    <li key={item.hostId} className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-stone-50 dark:hover:bg-stone-700/50">
                        <div className="flex items-center">
                            <span className={`w-6 font-bold ${getMedalColor(index)}`}>{index + 1}</span>
                            <span className="font-medium text-stone-800 dark:text-stone-200">{item.hostName}</span>
                        </div>
                        <span className="font-semibold text-purple-700 dark:text-purple-400">{formatValue(item[valueKey] as number)}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

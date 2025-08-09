import React, { useContext, useState, useMemo, useEffect } from 'react';
import { AppContext, AppContextType } from '../App';
import { ChevronLeft, ChevronRight, CalendarDays, BarChart2, TrendingUp, TrendingDown, Diamond, Hourglass, Target, CheckCircle } from 'lucide-react';
import Modal from '../components/Modal';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { motion } from 'framer-motion';

// Impor komponen
import Calendar from '../components/analysis/Calendar';
import TrendChart from '../components/analysis/TrendChart';
import AnimatedCard from '../components/dashboard/AnimatedCard'; // Kita gunakan lagi komponen animasi dari dasbor

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Tipe data untuk hasil kalkulasi performa
interface PerformanceData {
    workDays: number;
    totalHours: number;
    hourBalance: number;
    offDayEntitlement: number;
    remainingOffDays: number;
    totalDiamonds: number;
    revenuePerDay: number;
}

// Tipe data untuk data harian
interface DailySummary {
    minutes: number;
    revenue: number;
}
interface DailyData {
    [key: string]: DailySummary;
}

// Fungsi kalkulasi, sekarang berada di dalam file AnalysisPage
function calculateMonthlyPerformance(hostId: number, year: number, month: number, rekapLive: any[]): PerformanceData {
    const targetWorkDays = 26;
    const dailyTargetHours = 6;
    const minWorkMinutes = 120;

    const hostRekaps = rekapLive.filter(r => {
        const [recYear, recMonth] = r.tanggal_live.split('-').map(Number);
        return r.host_id === hostId && recYear === year && (recMonth - 1) === month && r.status === 'approved';
    });

    const dailyData = hostRekaps.reduce((acc, r) => {
        const dateKey = r.tanggal_live;
        if (!acc[dateKey]) {
            acc[dateKey] = { minutes: 0, revenue: 0 };
        }
        acc[dateKey].minutes += r.durasi_menit;
        acc[dateKey].revenue += r.pendapatan;
        return acc;
    }, {} as { [key: string]: { minutes: number; revenue: number } });

    let achievedWorkDays = 0;
    (Object.values(dailyData) as { minutes: number; revenue: number }[]).forEach((daySummary) => {
        if (daySummary.minutes >= minWorkMinutes) {
            achievedWorkDays++;
        }
    });
    
    let totalLiveMinutes = hostRekaps.reduce((sum, r) => sum + r.durasi_menit, 0);
    let absentDays = 0;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offDayEntitlement = daysInMonth - targetWorkDays;
    
    const today = new Date();
    const lastDayToCheck = (year === today.getFullYear() && month === today.getMonth()) ? today.getDate() : daysInMonth;
    
    const presentDays = new Set(Object.keys(dailyData));
    for (let day = 1; day <= lastDayToCheck; day++) {
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (!presentDays.has(dateString)) {
            absentDays++;
        }
    }

    const remainingOffDays = offDayEntitlement - absentDays;
    const totalLiveHours = totalLiveMinutes / 60;
    const targetLiveHours = achievedWorkDays * dailyTargetHours;
    const hourBalance = totalLiveHours - targetLiveHours;
    const totalDiamonds = hostRekaps.reduce((sum, r) => sum + r.pendapatan, 0);
    const revenuePerDay = achievedWorkDays > 0 ? Math.round(totalDiamonds / achievedWorkDays) : 0;

    return {
        workDays: achievedWorkDays,
        totalHours: totalLiveHours,
        hourBalance: hourBalance,
        offDayEntitlement: offDayEntitlement,
        remainingOffDays: remainingOffDays,
        totalDiamonds: totalDiamonds,
        revenuePerDay: revenuePerDay
    };
}
export function calculatePayroll(hostId: number, year: number, month: number, hosts: any[], rekapLive: any[]) {
    const host = hosts.find(h => h.id === hostId);
    if (!host) {
        return null;
    }
    const hostRekaps = rekapLive.filter(r => {
        const recDate = new Date(r.tanggal_live);
        return r.host_id === hostId && recDate.getFullYear() === year && recDate.getMonth() === month && r.status === 'approved';
    });
    const totalDiamonds = hostRekaps.reduce((sum, r) => sum + r.pendapatan, 0);
    const totalMinutes = hostRekaps.reduce((sum, r) => sum + r.durasi_menit, 0);
    const totalHours = totalMinutes / 60;
    const workDays = new Set(hostRekaps.map(r => r.tanggal_live)).size;
    let bonus = 0;
    if (totalDiamonds >= 300000) bonus = 5000000;
    else if (totalDiamonds >= 250000) bonus = 4000000;
    else if (totalDiamonds >= 200000) bonus = 3000000;
    else if (totalDiamonds >= 150000) bonus = 2000000;
    else if (totalDiamonds >= 100000) bonus = 1000000;
    else if (totalDiamonds >= 90000) bonus = 900000;
    else if (totalDiamonds >= 80000) bonus = 800000;
    else if (totalDiamonds >= 70000) bonus = 700000;
    else if (totalDiamonds >= 60000) bonus = 600000;
    else if (totalDiamonds >= 50000) bonus = 500000;
    const targetDays = 26;
    const targetHours = 156;
    const baseSalary = host.gaji_pokok || 0;
    const daysPercentage = Math.min(1, workDays / targetDays);
    const hoursPercentage = totalHours > 0 ? Math.min(1, totalHours / targetHours) : 0;
    const achievementPercentage = Math.min(daysPercentage, hoursPercentage);
    const adjustedBaseSalary = baseSalary * achievementPercentage;
    const deduction = baseSalary - adjustedBaseSalary;
    const finalSalary = adjustedBaseSalary + bonus;
    return { hostName: host.nama_host, totalHours, totalDiamonds, baseSalary, bonus, deduction, adjustedBaseSalary, finalSalary, workDays, targetDays, targetHours };
}

// Varian untuk container animasi
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

export default function AnalysisPage() {
    const { data, session } = useContext(AppContext) as AppContextType;
    const [currentDate, setCurrentDate] = useState(new Date());
    
    const isSuperAdmin = session!.user.user_metadata?.role === 'superadmin';
    const initialHostId = isSuperAdmin ? (data.hosts[0]?.id.toString() || '') : session!.user.user_metadata.host_id.toString();
    const [selectedHostId, setSelectedHostId] = useState(initialHostId);
    
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);

    useEffect(() => {
        if (isSuperAdmin && !selectedHostId && data.hosts.length > 0) {
            setSelectedHostId(data.hosts[0].id.toString());
        }
    }, [data.hosts, isSuperAdmin, selectedHostId]);

    const performance: PerformanceData = useMemo(() => {
        if (!selectedHostId) return { workDays: 0, totalHours: 0, hourBalance: 0, offDayEntitlement: 0, remainingOffDays: 0, totalDiamonds: 0, revenuePerDay: 0 };
        return calculateMonthlyPerformance(parseInt(selectedHostId), currentDate.getFullYear(), currentDate.getMonth(), data.rekapLive);
    }, [selectedHostId, currentDate, data.rekapLive]);

    const kpiCards = [
        { title: 'Hari Kerja Tercapai', value: performance.workDays, icon: CheckCircle },
        { title: 'Target Hari Kerja', value: 26, icon: Target },
        { title: 'Jatah Libur', value: performance.offDayEntitlement, icon: CalendarDays },
        { title: 'Sisa Jatah Libur', value: performance.remainingOffDays, icon: CalendarDays },
        { title: 'Total Jam Live', value: `${performance.totalHours.toFixed(1)} jam`, icon: Hourglass },
        { title: 'Keseimbangan Jam', value: `${performance.hourBalance.toFixed(1)} jam`, icon: performance.hourBalance >= 0 ? TrendingUp : TrendingDown },
        { title: 'Total Diamond', value: `${new Intl.NumberFormat().format(performance.totalDiamonds)}`, icon: Diamond },
        { title: 'Diamond per Hari', value: `${new Intl.NumberFormat().format(performance.revenuePerDay)}`, icon: BarChart2 },
    ];

    const handlePrevMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    const handleDayClick = (day: number) => { setSelectedDay(day); setIsDetailModalOpen(true); };
    const handleCloseModal = () => { setIsDetailModalOpen(false); setSelectedDay(null); };

    return (
        <section>
            <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm p-4 rounded-xl border border-purple-300 dark:border-cyan-400/30 shadow-lg mb-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    {isSuperAdmin && (
                        <select 
                            value={selectedHostId} 
                            onChange={(e) => setSelectedHostId(e.target.value)}
                            className="bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-600 text-stone-900 dark:text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full md:w-auto p-2.5"
                        >
                            {data.hosts.map(host => <option key={host.id} value={host.id}>{host.nama_host}</option>)}
                        </select>
                    )}
                    <div className="flex items-center space-x-2 mt-4 md:mt-0">
                        <button onClick={handlePrevMonth} className="p-2 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700"><ChevronLeft /></button>
                        <h3 className="font-semibold text-lg mx-2 text-center w-32 text-stone-800 dark:text-white">{currentDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</h3>
                        <button onClick={handleNextMonth} className="p-2 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700"><ChevronRight /></button>
                    </div>
                </div>
            </div>
            
            <motion.div 
                className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {kpiCards.map(card => (
                    <AnimatedCard key={card.title}>
                        <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm p-4 rounded-xl border border-purple-300 dark:border-cyan-400/30 shadow-lg h-full">
                            <card.icon className="h-6 w-6 text-purple-500 dark:text-cyan-400 mb-2" />
                            <h3 className="text-xs font-medium text-stone-500 dark:text-stone-400 truncate">{card.title}</h3>
                            <p className="text-2xl font-bold mt-1 text-stone-800 dark:text-white">{card.value}</p>
                        </div>
                    </AnimatedCard>
                ))}
            </motion.div>
            
            <Calendar currentDate={currentDate} selectedHostId={selectedHostId} onDayClick={handleDayClick} />
            
            <TrendChart selectedHostId={selectedHostId} />

            {selectedDay && (
                <CalendarDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={handleCloseModal}
                    day={selectedDay}
                    month={currentDate.getMonth()}
                    year={currentDate.getFullYear()}
                    selectedHostId={selectedHostId}
                />
            )}
        </section>
    );
}

// Komponen modal detail kalender
function CalendarDetailModal({ isOpen, onClose, day, month, year, selectedHostId }: { isOpen: boolean, onClose: () => void, day: number, month: number, year: number, selectedHostId: string }) {
    const { data } = useContext(AppContext) as AppContextType;
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const dailyRekaps = useMemo(() => {
        return data.rekapLive.filter(r => 
            r.host_id === parseInt(selectedHostId) && r.tanggal_live === dateString && r.status === 'approved'
        );
    }, [data.rekapLive, selectedHostId, dateString]);

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const formatDuration = (minutes: number) => `${Math.floor(minutes / 60)}j ${minutes % 60}m`;
    const formatDiamond = (num: number) => new Intl.NumberFormat().format(num);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Detail Live - ${formatDate(dateString)}`}>
            <div className="space-y-3 text-sm max-h-96 overflow-y-auto">
                {dailyRekaps.length > 0 ? dailyRekaps.map(rekap => {
                    const tiktokAccount = data.tiktokAccounts.find(t => t.id === rekap.tiktok_account_id);
                    return (
                        <div key={rekap.id} className="bg-stone-100 dark:bg-stone-700 p-3 rounded-lg">
                            <p className="font-semibold text-stone-800 dark:text-stone-200">Sesi Pukul {rekap.waktu_mulai}</p>
                            <div className="mt-1 border-t border-stone-200 dark:border-stone-600 pt-1 text-stone-600 dark:text-stone-300">
                                <p className="flex justify-between"><span>Akun:</span> <span>{tiktokAccount?.username || 'N/A'}</span></p>
                                <p className="flex justify-between"><span>Durasi:</span> <span>{formatDuration(rekap.durasi_menit)}</span></p>
                                <p className="flex justify-between"><span>Diamond:</span> <span>{formatDiamond(rekap.pendapatan)}</span></p>
                            </div>
                        </div>
                    );
                }) : <p>Tidak ada sesi live.</p>}
            </div>
        </Modal>
    );
}
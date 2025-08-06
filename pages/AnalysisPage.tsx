import React, { useContext, useState, useMemo, useEffect, Fragment } from 'react';
import { AppContext, AppContextType } from '../App';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../components/Modal';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);


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
    }, {} as DailyData);

    let achievedWorkDays = 0;
    (Object.values(dailyData) as DailySummary[]).forEach((daySummary) => {
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

// Fungsi ini diekspor agar bisa digunakan oleh halaman Gaji
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

    // Hitung Bonus berdasarkan target diamond
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

    // Hitung Potongan Gaji Pokok
    const targetDays = 26;
    const targetHours = 156;
    const baseSalary = host.gaji_pokok || 0;
    
    const daysPercentage = Math.min(1, workDays / targetDays);
    const hoursPercentage = totalHours > 0 ? Math.min(1, totalHours / targetHours) : 0;
    
    const achievementPercentage = Math.min(daysPercentage, hoursPercentage);
    const adjustedBaseSalary = baseSalary * achievementPercentage;
    const deduction = baseSalary - adjustedBaseSalary;

    const finalSalary = adjustedBaseSalary + bonus;

    return {
        hostName: host.nama_host,
        totalHours,
        totalDiamonds,
        baseSalary,
        bonus,
        deduction,
        adjustedBaseSalary,
        finalSalary,
        workDays,
        targetDays,
        targetHours,
    };
}


// Komponen ini adalah halaman Analisis Kinerja.
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
        { title: 'Hari Kerja Tercapai', value: performance.workDays },
        { title: 'Target Hari Kerja', value: 26 },
        { title: 'Jatah Libur Sebulan', value: performance.offDayEntitlement },
        { title: 'Sisa Jatah Libur', value: performance.remainingOffDays },
        { title: 'Total Jam Live', value: `${performance.totalHours.toFixed(1)} jam` },
        { title: 'Keseimbangan Jam', value: `${performance.hourBalance.toFixed(1)} jam` },
        { title: 'Total Diamond Bulan Ini', value: `${new Intl.NumberFormat().format(performance.totalDiamonds)} 💎` },
        { title: 'Diamond per Hari (Efisiensi)', value: `${new Intl.NumberFormat().format(performance.revenuePerDay)} 💎/hari` },
    ];

    const handlePrevMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };
    
    const handleDayClick = (day: number) => {
        setSelectedDay(day);
        setIsDetailModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsDetailModalOpen(false);
        setSelectedDay(null);
    };

    return (
        <section>
            <div className="bg-white dark:bg-stone-800 p-6 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 mb-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    {isSuperAdmin && (
                        <select 
                            value={selectedHostId} 
                            onChange={(e) => setSelectedHostId(e.target.value)}
                            className="bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full md:w-auto p-2.5 dark:bg-stone-700 dark:border-stone-600 dark:placeholder-stone-400 dark:text-white"
                        >
                            {data.hosts.map(host => <option key={host.id} value={host.id}>{host.nama_host}</option>)}
                        </select>
                    )}
                    <div className="flex items-center space-x-2 mt-4 md:mt-0">
                        <button onClick={handlePrevMonth} className="p-2 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700"><ChevronLeft /></button>
                        <h3 className="font-semibold text-lg mx-2 text-center w-32">{currentDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</h3>
                        <button onClick={handleNextMonth} className="p-2 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700"><ChevronRight /></button>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {kpiCards.map(card => (
                    <div key={card.title} className="bg-white dark:bg-stone-800 p-6 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700">
                        <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400">{card.title}</h3>
                        <p className="text-3xl font-bold mt-2 text-stone-900 dark:text-white">{card.value}</p>
                    </div>
                ))}
            </div>
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

// Komponen Kalender
function Calendar({ currentDate, selectedHostId, onDayClick }: { currentDate: Date, selectedHostId: string, onDayClick: (day: number) => void }) {
    const { data } = useContext(AppContext) as AppContextType;
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const dailyData = useMemo(() => {
        const hostRekaps = data.rekapLive.filter(r => 
            r.host_id === parseInt(selectedHostId) && r.status === 'approved'
        );

        return hostRekaps.reduce((acc, r) => {
            const [recYear, recMonth, recDay] = r.tanggal_live.split('-').map(Number);
            if (recYear === year && (recMonth - 1) === month) {
                if (!acc[recDay]) {
                    acc[recDay] = { totalMinutes: 0, totalDiamonds: 0 };
                }
                acc[recDay].totalMinutes += r.durasi_menit;
                acc[recDay].totalDiamonds += r.pendapatan;
            }
            return acc;
        }, {} as { [key: number]: { totalMinutes: number, totalDiamonds: number } });
    }, [data.rekapLive, selectedHostId, year, month]);

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = (firstDayOfMonth === 0) ? 6 : firstDayOfMonth - 1;

    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const emptyStartDays = Array.from({ length: startDay });

    return (
        <div className="mt-8 bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-4">
            <div className="grid grid-cols-7 gap-1 text-center font-semibold text-stone-600 dark:text-stone-300 mb-2">
                {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(day => <div key={day} className="text-xs md:text-sm">{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {emptyStartDays.map((_, i) => <div key={`empty-${i}`} className="border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 rounded-md h-16 md:h-32"></div>)}
                {daysArray.map(day => {
                    const dayData = dailyData[day];
                    const isLive = dayData && dayData.totalMinutes >= 120;
                    const clickableClass = isLive ? 'cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-700' : '';
                    
                    return (
                        <div key={day} onClick={() => isLive && onDayClick(day)} className={`border border-stone-200 dark:border-stone-700 p-1 md:p-2 rounded-md h-16 md:h-32 flex flex-col ${clickableClass}`}>
                            <div className="font-bold text-stone-800 dark:text-stone-200 text-xs md:text-base">{day}</div>
                            <div className="mt-1">
                                <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${isLive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                                    {isLive ? 'Live' : 'Absent'}
                                </span>
                            </div>
                            {isLive && (
                                <div className="hidden md:flex text-xs mt-2 space-y-1 flex-col">
                                    <p className="flex justify-between"><span>Jam:</span> <span>{`${Math.floor(dayData.totalMinutes / 60)}j ${dayData.totalMinutes % 60}m`}</span></p>
                                    <p className="flex justify-between"><span>Diamond:</span> <span>{new Intl.NumberFormat().format(dayData.totalDiamonds)}</span></p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Komponen Grafik Tren 30 Hari
function TrendChart({ selectedHostId }: { selectedHostId: string }) {
    const { data } = useContext(AppContext) as AppContextType;
    const [metric, setMetric] = useState('revenue'); // 'revenue' atau 'duration'

    const trendData = useMemo(() => {
        const labels: string[] = [];
        const revenueData: number[] = [];
        const durationData: number[] = [];

        const hostRekaps = data.rekapLive.filter(r => r.host_id === parseInt(selectedHostId) && r.status === 'approved');

        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            labels.push(date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }));

            const rekapsForDay = hostRekaps.filter(r => r.tanggal_live === dateString);
            
            const dailyRevenue = rekapsForDay.reduce((sum, r) => sum + r.pendapatan, 0);
            const dailyDuration = rekapsForDay.reduce((sum, r) => sum + r.durasi_menit, 0);

            revenueData.push(dailyRevenue);
            durationData.push(dailyDuration);
        }

        return { labels, revenueData, durationData };
    }, [data.rekapLive, selectedHostId]);

    const chartData = {
        labels: trendData.labels,
        datasets: [
            {
                label: metric === 'revenue' ? 'Pendapatan Diamond' : 'Durasi Live (Menit)',
                data: metric === 'revenue' ? trendData.revenueData : trendData.durationData,
                borderColor: 'rgb(168, 85, 247)',
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                fill: true,
                tension: 0.4,
            },
        ],
    };

    return (
        <div className="mt-8 bg-white dark:bg-stone-800 p-6 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <h2 className="text-xl font-semibold">Tren Kinerja 30 Hari Terakhir</h2>
                <div className="flex items-center space-x-2 mt-2 sm:mt-0 bg-stone-100 dark:bg-stone-700 p-1 rounded-lg">
                    <button onClick={() => setMetric('revenue')} className={`px-3 py-1 text-sm font-semibold rounded-md ${metric === 'revenue' ? 'bg-white dark:bg-stone-800 shadow' : 'text-stone-600 dark:text-stone-300'}`}>Diamond</button>
                    <button onClick={() => setMetric('duration')} className={`px-3 py-1 text-sm font-semibold rounded-md ${metric === 'duration' ? 'bg-white dark:bg-stone-800 shadow' : 'text-stone-600 dark:text-stone-300'}`}>Durasi</button>
                </div>
            </div>
            <div className="relative h-80">
                <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
        </div>
    );
}

// Komponen baru untuk konten modal detail kalender
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
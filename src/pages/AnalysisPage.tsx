import React, { useContext, useState, useMemo, useEffect } from 'react';
import { AppContext, AppContextType } from '../App';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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


// Komponen ini adalah halaman Analisis Kinerja.
// Ia menampilkan KPI bulanan dan kalender kinerja.
export default function AnalysisPage() {
    const { data, session } = useContext(AppContext) as AppContextType;
    const [currentDate, setCurrentDate] = useState(new Date());
    
    const isSuperAdmin = session!.user.user_metadata?.role === 'superadmin';
    const initialHostId = isSuperAdmin ? (data.hosts[0]?.id.toString() || '') : session!.user.user_metadata.host_id.toString();
    const [selectedHostId, setSelectedHostId] = useState(initialHostId);

    // Efek ini memastikan bahwa saat data host selesai dimuat,
    // dropdown untuk superadmin akan memilih host pertama secara default.
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
            <Calendar currentDate={currentDate} selectedHostId={selectedHostId} />
        </section>
    );
}

// Komponen Kalender, sekarang berada di dalam file AnalysisPage
function Calendar({ currentDate, selectedHostId }: { currentDate: Date, selectedHostId: string }) {
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
            <div className="hidden md:grid grid-cols-7 gap-1 text-center font-semibold text-stone-600 dark:text-stone-300 mb-2">
                {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="block md:grid md:grid-cols-7 gap-1">
                {emptyStartDays.map((_, i) => <div key={`empty-${i}`} className="hidden md:block border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 rounded-md h-32"></div>)}
                {daysArray.map(day => {
                    const dayData = dailyData[day];
                    const isLive = dayData && dayData.totalMinutes >= 120;
                    return (
                        <React.Fragment key={day}>
                            {/* Desktop View */}
                            <div className="hidden md:flex border border-stone-200 dark:border-stone-700 p-2 rounded-md h-32 flex-col">
                                <div className="font-bold text-stone-800 dark:text-stone-200">{day}</div>
                                <div className="mt-1">
                                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${isLive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                                        {isLive ? 'Live' : 'Absent'}
                                    </span>
                                </div>
                                {isLive && (
                                    <div className="text-xs mt-2 space-y-1">
                                        <p className="flex justify-between"><span>Jam:</span> <span>{`${Math.floor(dayData.totalMinutes / 60)}j ${dayData.totalMinutes % 60}m`}</span></p>
                                        <p className="flex justify-between"><span>Diamond:</span> <span>{new Intl.NumberFormat().format(dayData.totalDiamonds)}</span></p>
                                    </div>
                                )}
                            </div>
                            {/* Mobile View */}
                            <div className="flex md:hidden calendar-day-mobile border-b border-stone-200 dark:border-stone-700">
                                <div className={`date-circle ${isLive ? 'bg-green-200 dark:bg-green-800' : 'bg-stone-200 dark:bg-stone-700'}`}>
                                    {day}
                                </div>
                                <div className="details">
                                    {isLive ? (
                                        <div className="text-sm">
                                            <p className="font-semibold text-stone-800 dark:text-stone-200">{`${Math.floor(dayData.totalMinutes / 60)}j ${dayData.totalMinutes % 60}m`}</p>
                                            <p className="text-stone-600 dark:text-stone-300">{new Intl.NumberFormat().format(dayData.totalDiamonds)} 💎</p>
                                        </div>
                                    ) : <p className="text-sm text-stone-500 dark:text-stone-400">Absent</p>}
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
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
    const dailySummaries: DailySummary[] = Object.values(dailyData);
    dailySummaries.forEach((daySummary) => {
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

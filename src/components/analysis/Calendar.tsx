import React, { useContext, useMemo, useState } from 'react';
import { AppContext, AppContextType } from '../../App';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Diamond, XCircle } from 'lucide-react';

interface CalendarProps {
    currentDate: Date;
    selectedHostId: string;
    onDayClick: (day: number) => void;
}

export default function Calendar({ currentDate, selectedHostId, onDayClick }: CalendarProps) {
    const { data, theme } = useContext(AppContext) as AppContextType;
    const [hoveredDay, setHoveredDay] = useState<number | null>(null);
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const dailyData = useMemo(() => {
        if (!selectedHostId) return {};
        const hostRekaps = data.rekapLive.filter(r => r.host_id === parseInt(selectedHostId) && r.status === 'approved');
        return hostRekaps.reduce((acc, r) => {
            const [recYear, recMonth, recDay] = r.tanggal_live.split('-').map(Number);
            if (recYear === year && (recMonth - 1) === month) {
                if (!acc[recDay]) acc[recDay] = { totalMinutes: 0, totalDiamonds: 0 };
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

    const formatDuration = (minutes: number) => `${Math.floor(minutes / 60)}j ${minutes % 60}m`;
    const formatDiamond = (num: number) => new Intl.NumberFormat().format(num);

    return (
        <div className="mt-8 bg-white dark:bg-stone-900 p-6 rounded-2xl border-[3px] border-stone-900 dark:border-stone-100 shadow-[6px_6px_0px_0px_#ec4899] dark:shadow-[6px_6px_0px_0px_#06b6d4] transition-colors duration-300">
            <div className="grid grid-cols-7 gap-1 text-center font-extrabold text-stone-900 dark:text-stone-100 mb-4 border-b-2 border-stone-900 dark:border-stone-700 pb-3">
                {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day, i) => <div key={i} className="text-xs md:text-sm tracking-wider uppercase">{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-3">
                {emptyStartDays.map((_, i) => <div key={`empty-${i}`} className="h-20 md:h-24"></div>)}
                {daysArray.map(day => {
                    const dayData = dailyData[day];
                    const isLive = dayData && dayData.totalMinutes >= 120;
                    
                    const diamondIntensity = isLive ? Math.min(1, dayData.totalDiamonds / 50000) : 0;
                    const barHeight = Math.max(10, diamondIntensity * 100);

                    return (
                        <motion.div 
                            key={day} 
                            onClick={() => isLive && onDayClick(day)}
                            onMouseEnter={() => setHoveredDay(day)}
                            onMouseLeave={() => setHoveredDay(null)}
                            className={`relative h-20 md:h-24 flex items-center justify-center rounded-xl transition-all duration-200 ${isLive ? 'bg-white dark:bg-stone-800 cursor-pointer border-[3px] border-stone-900 dark:border-stone-100 shadow-[3px_3px_0px_0px_#ec4899] dark:shadow-[3px_3px_0px_0px_#06b6d4] hover:shadow-[5px_5px_0px_0px_#ec4899] dark:hover:shadow-[5px_5px_0px_0px_#06b6d4] hover:-translate-x-0.5 hover:-translate-y-0.5' : 'bg-stone-100/40 dark:bg-stone-900/40 border-2 border-stone-200 dark:border-stone-800/60 opacity-40'}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: day * 0.01 }}
                        >
                            <span className="font-extrabold text-stone-900 dark:text-stone-100 text-lg md:text-xl z-10">{day}</span>
                            
                            {isLive && (
                                <div className="absolute bottom-0 left-0 w-full h-full flex items-end overflow-hidden rounded-b-[8px]">
                                    <div 
                                        className="w-full unity-gradient-bg"
                                        style={{ height: `${barHeight}%`, opacity: 0.45, maskImage: 'linear-gradient(to top, white 20%, transparent 100%)' }}
                                    ></div>
                                </div>
                            )}

                            <AnimatePresence>
                                {hoveredDay === day && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute bottom-full mb-2 w-max max-w-xs bg-stone-950/95 border-2 border-stone-900 dark:border-stone-100 text-white text-xs rounded-xl p-3 z-30 pointer-events-none shadow-[3px_3px_0px_0px_#000]"
                                    >
                                        {isLive ? (
                                            <div className="space-y-1.5 font-bold">
                                                <div className="flex items-center gap-2 text-pink-400 dark:text-cyan-400"><Clock size={14} /><span>Jam Live: {formatDuration(dayData.totalMinutes)}</span></div>
                                                <div className="flex items-center gap-2 text-yellow-400"><Diamond size={14} /><span>Diamond: {formatDiamond(dayData.totalDiamonds)} 💎</span></div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-red-400 font-bold"><XCircle size={14} /><span>Absen / Off</span></div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

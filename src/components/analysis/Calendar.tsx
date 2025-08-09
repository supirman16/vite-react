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
        <div className="mt-8 bg-white/50 dark:bg-stone-900/50 backdrop-blur-sm rounded-xl border border-purple-300 dark:border-cyan-400/30 shadow-lg p-4">
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-purple-600 dark:text-cyan-400 mb-2">
                {['S', 'S', 'R', 'K', 'J', 'S', 'M'].map((day, i) => <div key={i} className="text-xs md:text-sm">{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-2">
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
                            // --- PERBAIKAN DI SINI: Menghapus 'overflow-hidden' ---
                            className={`relative h-20 md:h-24 flex items-center justify-center rounded-lg transition-all duration-300 ${isLive ? 'bg-stone-50 dark:bg-stone-800/80 cursor-pointer' : 'bg-stone-200/50 dark:bg-stone-900/50 opacity-60'}`}
                            whileHover={isLive ? { scale: 1.05, zIndex: 10 } : {}}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: day * 0.01 }}
                        >
                            <div 
                                className="absolute inset-0 transition-all duration-300 rounded-lg" // Menambahkan rounded-lg di sini
                                style={{ boxShadow: isLive ? `0 0 12px rgba(${theme === 'dark' ? '34, 211, 238,' : '168, 85, 247,'} 0.4)` : 'none' }}
                            ></div>
                            <span className="font-bold text-stone-800 dark:text-stone-200 text-lg md:text-xl z-10">{day}</span>
                            
                            {isLive && (
                                <div className="absolute bottom-0 left-0 w-full h-full flex items-end">
                                    <div 
                                        className="w-full unity-gradient-bg rounded-b-lg" // Menambahkan rounded-b-lg
                                        style={{ height: `${barHeight}%`, opacity: 0.6, maskImage: 'linear-gradient(to top, white 20%, transparent 100%)' }}
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
                                        className="absolute bottom-full mb-2 w-max max-w-xs bg-black/80 backdrop-blur-sm text-white text-xs rounded-lg p-2 z-20 pointer-events-none"
                                    >
                                        {isLive ? (
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2"><Clock size={14} /><span>Total Jam: {formatDuration(dayData.totalMinutes)}</span></div>
                                                <div className="flex items-center gap-2"><Diamond size={14} /><span>Total Diamond: {formatDiamond(dayData.totalDiamonds)}</span></div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-red-400"><XCircle size={14} /><span>Absent</span></div>
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

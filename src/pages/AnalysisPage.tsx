import { useContext, useState, useMemo, useEffect } from 'react';
import { AppContext, AppContextType } from '../App';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../components/Modal';

// ... (Interface dan fungsi calculateMonthlyPerformance tetap sama) ...

// Komponen ini adalah halaman Analisis Kinerja.
export default function AnalysisPage() {
    // ... (State dan logika KPI tetap sama) ...
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);

    const handleDayClick = (day: number) => {
        setSelectedDay(day);
        setIsDetailModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsDetailModalOpen(false);
        setSelectedDay(null);
    };
    
    // ... (Bagian return utama tetap sama, hanya menambahkan render modal) ...

    return (
        <section>
            {/* ... (Filter dan KPI cards) ... */}
            <Calendar currentDate={currentDate} selectedHostId={selectedHostId} onDayClick={handleDayClick} />
            
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

// Komponen Kalender, sekarang menerima prop onDayClick
function Calendar({ currentDate, selectedHostId, onDayClick }: { currentDate: Date, selectedHostId: string, onDayClick: (day: number) => void }) {
    // ... (Logika untuk menghitung dailyData tetap sama) ...

    return (
        <div className="mt-8 bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-4">
            {/* ... (Header kalender) ... */}
            <div className="block md:grid md:grid-cols-7 gap-1">
                {/* ... (Sel kosong) ... */}
                {daysArray.map(day => {
                    const dayData = dailyData[day];
                    const isLive = dayData && dayData.totalMinutes >= 120;
                    const clickableClass = isLive ? 'cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-700' : '';
                    
                    return (
                        <React.Fragment key={day}>
                            {/* Desktop View */}
                            <div onClick={() => isLive && onDayClick(day)} className={`hidden md:flex border border-stone-200 dark:border-stone-700 p-2 rounded-md h-32 flex-col ${clickableClass}`}>
                                {/* ... (Konten sel desktop) ... */}
                            </div>
                            {/* Mobile View */}
                            <div onClick={() => isLive && onDayClick(day)} className={`flex md:hidden calendar-day-mobile border-b border-stone-200 dark:border-stone-700 ${clickableClass}`}>
                                {/* ... (Konten sel mobile) ... */}
                            </div>
                        </React.Fragment>
                    );
                })}
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

// ... (Fungsi calculateMonthlyPerformance tetap sama) ...

import { useContext, useState, useMemo } from 'react';
import { AppContext, AppContextType } from '../App';
import { calculatePayroll } from './AnalysisPage';

// Komponen ini adalah halaman "Gaji Saya" untuk host.
export default function MySalaryPage() {
    const { data, session } = useContext(AppContext) as AppContextType;
    const [month, setMonth] = useState(new Date().getMonth());
    const [year, setYear] = useState(new Date().getFullYear());

    const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

    const hostId = session!.user.user_metadata.host_id;

    const payrollData = useMemo(() => {
        if (!hostId) return null;
        return calculatePayroll(hostId, year, month, data.hosts, data.rekapLive);
    }, [hostId, year, month, data.hosts, data.rekapLive]);
    
    const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
    const formatDiamond = (num: number) => new Intl.NumberFormat().format(num);

    return (
        <section>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100">Rincian Gaji Saya</h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Lihat rincian perhitungan gaji Anda per bulan.</p>
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
            {payrollData ? (
                <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-8 max-w-2xl mx-auto">
                    <div className="space-y-4 text-sm">
                        {/* Bagian Gaji Pokok */}
                        <div className="bg-stone-50 dark:bg-stone-700 p-4 rounded-lg">
                            <h3 className="font-semibold text-stone-700 dark:text-stone-200 mb-2 border-b dark:border-stone-600 pb-2">Gaji Pokok</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-stone-500 dark:text-stone-400">Gaji Pokok Awal:</span>
                                    <span className="font-medium text-stone-900 dark:text-white">{formatRupiah(payrollData.baseSalary)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-stone-500 dark:text-stone-400">Pencapaian Jam:</span>
                                    <span className="font-medium text-stone-900 dark:text-white">{`${payrollData.totalHours.toFixed(2)} jam / ${payrollData.targetHours} jam`}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-stone-500 dark:text-stone-400">Pencapaian Hari:</span>
                                    <span className="font-medium text-stone-900 dark:text-white">{`${payrollData.workDays} hari / ${payrollData.targetDays} hari`}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-stone-500 dark:text-stone-400">Potongan Kinerja:</span>
                                    <span className="font-medium text-red-600 dark:text-red-400">{formatRupiah(payrollData.deduction)}</span>
                                </div>
                                <div className="flex justify-between border-t dark:border-stone-600 pt-2">
                                    <span className="font-semibold text-stone-600 dark:text-stone-300">Gaji Pokok Disesuaikan:</span>
                                    <span className="font-bold text-stone-900 dark:text-white">{formatRupiah(payrollData.adjustedBaseSalary)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Bagian Bonus */}
                        <div className="bg-stone-50 dark:bg-stone-700 p-4 rounded-lg">
                            <h3 className="font-semibold text-stone-700 dark:text-stone-200 mb-2 border-b dark:border-stone-600 pb-2">Bonus Kinerja</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-stone-500 dark:text-stone-400">Total Diamond Tercapai:</span>
                                    <span className="font-medium text-stone-900 dark:text-white">{formatDiamond(payrollData.totalDiamonds)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-semibold text-stone-600 dark:text-stone-300">Bonus Diamond:</span>
                                    <span className="font-bold text-green-600 dark:text-green-400">{formatRupiah(payrollData.bonus)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Total Gaji Akhir */}
                        <div className="bg-purple-50 dark:bg-purple-900/50 p-4 rounded-lg mt-6">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-bold text-purple-800 dark:text-purple-300">GAJI AKHIR (Take Home Pay):</span>
                                <span className="text-xl font-extrabold text-purple-800 dark:text-purple-300">{formatRupiah(payrollData.finalSalary)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center p-8 bg-white dark:bg-stone-800 rounded-xl shadow-sm">
                    <p>Data gaji untuk periode ini tidak tersedia.</p>
                </div>
            )}
        </section>
    );
}

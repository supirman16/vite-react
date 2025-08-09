import { useContext, useState, useMemo } from 'react';
import { AppContext, AppContextType } from '../App';
import { calculatePayroll } from './AnalysisPage';
import Modal from '../components/Modal';
import { DollarSign } from 'lucide-react';

export default function PayrollPage() {
    const [month, setMonth] = useState(new Date().getMonth());
    const [year, setYear] = useState(new Date().getFullYear());
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedPayroll, setSelectedPayroll] = useState<any | null>(null);

    const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

    const handleViewDetail = (payrollData: any) => {
        setSelectedPayroll(payrollData);
        setIsDetailModalOpen(true);
    };

    const handleCloseDetail = () => {
        setIsDetailModalOpen(false);
        setSelectedPayroll(null);
    };

    const commonSelectClasses = "bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 dark:bg-stone-700 dark:border-stone-600 dark:placeholder-stone-400 dark:text-white";

    return (
        <section>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100">Sistem Gaji Host</h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Lihat dan kelola laporan gaji bulanan untuk host.</p>
                </div>
                <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                     <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className={commonSelectClasses}>
                        {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                     </select>
                     <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className={commonSelectClasses}>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                     </select>
                </div>
            </div>
            <PayrollTable month={month} year={year} onViewDetail={handleViewDetail} />
            {selectedPayroll && <PayrollDetailModal isOpen={isDetailModalOpen} onClose={handleCloseDetail} payrollData={selectedPayroll} period={new Date(year, month).toLocaleString('id-ID', { month: 'long', year: 'numeric' })} />}
        </section>
    );
}

function PayrollTable({ month, year, onViewDetail }: { month: number, year: number, onViewDetail: (data: any) => void }) {
    const { data } = useContext(AppContext) as AppContextType;

    const payrolls = useMemo(() => {
        return data.hosts.filter(host => host.status === 'Aktif').map(host => calculatePayroll(host.id, year, month, data.hosts, data.rekapLive)).filter(p => p !== null);
    }, [data.hosts, data.rekapLive, year, month]);

    const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

    return (
        <div className="bg-transparent md:bg-white/80 md:dark:bg-stone-900/80 md:backdrop-blur-sm rounded-xl md:shadow-lg md:border md:border-purple-300 md:dark:border-cyan-400/30 md:overflow-hidden">
            <table className="w-full text-sm text-left text-stone-600 dark:text-stone-300">
                <thead className="hidden md:table-header-group text-xs text-purple-600 dark:text-cyan-400 uppercase bg-stone-100 dark:bg-black/30">
                    <tr>
                        <th scope="col" className="px-6 py-3">Nama Host</th>
                        <th scope="col" className="px-6 py-3">Gaji Pokok</th>
                        <th scope="col" className="px-6 py-3">Bonus</th>
                        <th scope="col" className="px-6 py-3">Potongan</th>
                        <th scope="col" className="px-6 py-3">Gaji Akhir</th>
                        <th scope="col" className="px-6 py-3 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody className="block md:table-row-group">
                    {payrolls.length > 0 ? payrolls.map(p => (
                        <tr key={p!.hostName} onClick={() => onViewDetail(p)} className="block md:table-row bg-white dark:bg-stone-800/80 border-b dark:border-stone-700 mb-4 md:mb-0 rounded-lg md:rounded-none shadow-lg md:shadow-none cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                            <td className="p-4 md:hidden">
                                <div className="flex justify-between items-center">
                                    <div className="font-bold text-lg text-stone-800 dark:text-white">{p!.hostName}</div>
                                    <div className="font-bold text-lg flex items-center justify-end text-purple-600 dark:text-cyan-400">
                                        <DollarSign className="w-4 h-4 mr-1.5" />
                                        {new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(p!.finalSalary)}
                                    </div>
                                </div>
                            </td>
                            <td className="hidden md:table-cell px-6 py-4 font-medium text-stone-900 dark:text-white">{p!.hostName}</td>
                            <td className="hidden md:table-cell px-6 py-4">{formatRupiah(p!.baseSalary)}</td>
                            <td className="hidden md:table-cell px-6 py-4 text-green-600 dark:text-green-400">{formatRupiah(p!.bonus)}</td>
                            <td className="hidden md:table-cell px-6 py-4 text-red-600 dark:text-red-400">{formatRupiah(p!.deduction)}</td>
                            <td className="hidden md:table-cell px-6 py-4 font-bold text-purple-700 dark:text-purple-500">{formatRupiah(p!.finalSalary)}</td>
                            <td className="hidden md:table-cell px-6 py-4 text-center"><button onClick={(e) => { e.stopPropagation(); onViewDetail(p); }} className="font-medium text-purple-600 hover:underline dark:text-purple-500">Detail</button></td>
                        </tr>
                    )) : (
                        <tr><td colSpan={6} className="text-center py-8 text-stone-500 dark:text-stone-400">Tidak ada data gaji untuk ditampilkan.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

function PayrollDetailModal({ isOpen, onClose, payrollData, period }: { isOpen: boolean, onClose: () => void, payrollData: any, period: string }) {
    const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
    const formatDiamond = (num: number) => new Intl.NumberFormat().format(num);
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Rincian Gaji: ${payrollData.hostName}`}>
            <p className="text-center -mt-4 mb-4 text-sm font-semibold unity-gradient-text">{period}</p>
            <div className="space-y-4 text-sm">
                <div className="bg-stone-50 dark:bg-stone-700 p-4 rounded-lg"><h3 className="font-semibold text-stone-700 dark:text-stone-200 mb-2 border-b dark:border-stone-600 pb-2">Gaji Pokok</h3><div className="space-y-2"><div className="flex justify-between"><span className="text-stone-500 dark:text-stone-400">Gaji Pokok Awal:</span><span className="font-medium text-stone-900 dark:text-white">{formatRupiah(payrollData.baseSalary)}</span></div><div className="flex justify-between"><span className="text-stone-500 dark:text-stone-400">Pencapaian Jam:</span><span className="font-medium text-stone-900 dark:text-white">{`${payrollData.totalHours.toFixed(2)} jam / ${payrollData.targetHours} jam`}</span></div><div className="flex justify-between"><span className="text-stone-500 dark:text-stone-400">Pencapaian Hari:</span><span className="font-medium text-stone-900 dark:text-white">{`${payrollData.workDays} hari / ${payrollData.targetDays} hari`}</span></div><div className="flex justify-between"><span className="text-stone-500 dark:text-stone-400">Potongan Kinerja:</span><span className="font-medium text-red-600 dark:text-red-400">{formatRupiah(payrollData.deduction)}</span></div><div className="flex justify-between border-t dark:border-stone-600 pt-2"><span className="font-semibold text-stone-600 dark:text-stone-300">Gaji Pokok Disesuaikan:</span><span className="font-bold text-stone-900 dark:text-white">{formatRupiah(payrollData.adjustedBaseSalary)}</span></div></div></div>
                <div className="bg-stone-50 dark:bg-stone-700 p-4 rounded-lg"><h3 className="font-semibold text-stone-700 dark:text-stone-200 mb-2 border-b dark:border-stone-600 pb-2">Bonus Kinerja</h3><div className="space-y-2"><div className="flex justify-between"><span className="text-stone-500 dark:text-stone-400">Total Diamond Tercapai:</span><span className="font-medium text-stone-900 dark:text-white">{formatDiamond(payrollData.totalDiamonds)}</span></div><div className="flex justify-between"><span className="font-semibold text-stone-600 dark:text-stone-300">Bonus Diamond:</span><span className="font-bold text-green-600 dark:text-green-400">{formatRupiah(payrollData.bonus)}</span></div></div></div>
                <div className="bg-purple-50 dark:bg-purple-900/50 p-4 rounded-lg mt-6"><div className="flex justify-between items-center"><span className="text-lg font-bold text-purple-800 dark:text-purple-300">GAJI AKHIR (Take Home Pay):</span><span className="text-xl font-extrabold text-purple-800 dark:text-purple-300">{formatRupiah(payrollData.finalSalary)}</span></div></div>
            </div>
            <div className="flex justify-end pt-6 mt-4 border-t dark:border-stone-700"><button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-white unity-gradient-bg rounded-lg hover:opacity-90">Tutup</button></div>
        </Modal>
    );
}

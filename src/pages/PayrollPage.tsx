import { useContext, useState, useMemo, useEffect } from 'react';
import { AppContext, AppContextType, supabase } from '../App';
import { calculatePayroll } from './AnalysisPage';
import Modal from '../components/Modal';
import { DollarSign, Copy, Check, Share2, ClipboardList, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function PayrollPage() {
    const [month, setMonth] = useState(new Date().getMonth());
    const [year, setYear] = useState(new Date().getFullYear());
    const [activeTab, setActiveTab] = useState<'table' | 'transfer'>('table');
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

    const commonSelectClasses = "bg-white dark:bg-stone-900 border-[3px] border-stone-900 dark:border-stone-100 text-stone-900 dark:text-white text-sm font-bold block w-full p-2.5 shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff] focus:outline-none";

    return (
        <section>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100">Sistem Gaji Host</h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Lihat laporan gaji bulanan dan asisten transfer cepat untuk host.</p>
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

            {/* TAB SELECTOR */}
            <div className="flex mb-8 border-[3px] border-stone-900 dark:border-stone-100 max-w-md bg-stone-100 dark:bg-stone-800 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] overflow-hidden rounded-none">
                <button
                    onClick={() => setActiveTab('table')}
                    className={`flex-1 py-3 text-sm font-extrabold transition-all flex items-center justify-center gap-2 uppercase tracking-wide border-r-[3px] border-stone-900 dark:border-stone-100 ${activeTab === 'table' ? 'bg-pink-500 text-white dark:bg-cyan-500 dark:text-stone-950' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'}`}
                >
                    <ClipboardList className="h-4 w-4" />
                    Tabel Rincian Gaji
                </button>
                <button
                    onClick={() => setActiveTab('transfer')}
                    className={`flex-1 py-3 text-sm font-extrabold transition-all flex items-center justify-center gap-2 uppercase tracking-wide ${activeTab === 'transfer' ? 'bg-pink-500 text-white dark:bg-cyan-500 dark:text-stone-950' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'}`}
                >
                    <DollarSign className="h-4 w-4" />
                    Asisten Transfer Cepat
                </button>
            </div>

            {activeTab === 'table' ? (
                <PayrollTable month={month} year={year} onViewDetail={handleViewDetail} />
            ) : (
                <TransferAssistant month={month} year={year} />
            )}

            {selectedPayroll && (
                <PayrollDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={handleCloseDetail}
                    payrollData={selectedPayroll}
                    period={new Date(year, month).toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
                />
            )}
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
        <div className="bg-white dark:bg-stone-900 border-[3px] border-stone-900 dark:border-stone-100 shadow-[5px_5px_0px_0px_#ec4899] dark:shadow-[5px_5px_0px_0px_#06b6d4] overflow-x-auto overflow-hidden transition-all duration-300">
            <table className="w-full text-sm text-left text-stone-600 dark:text-stone-300 border-collapse">
                <thead className="hidden md:table-header-group text-xs text-stone-900 dark:text-stone-200 uppercase bg-stone-100 dark:bg-stone-800 border-b-[3px] border-stone-900 dark:border-stone-100 font-extrabold">
                    <tr>
                        <th scope="col" className="px-6 py-4">Nama Host</th>
                        <th scope="col" className="px-6 py-4">Gaji Pokok</th>
                        <th scope="col" className="px-6 py-4">Bonus</th>
                        <th scope="col" className="px-6 py-4">Potongan</th>
                        <th scope="col" className="px-6 py-4">Gaji Akhir</th>
                        <th scope="col" className="px-6 py-4 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody className="block md:table-row-group">
                    {payrolls.length > 0 ? payrolls.map(p => (
                        <tr key={p!.hostName} onClick={() => onViewDetail(p)} className="block md:table-row bg-white dark:bg-stone-900 border-b-2 border-stone-900 dark:border-stone-800 mb-4 md:mb-0 rounded-none cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors">
                            <td className="p-4 md:hidden">
                                <div className="flex justify-between items-center">
                                    <div className="font-extrabold text-base text-stone-900 dark:text-white">{p!.hostName}</div>
                                    <div className="font-bold text-base flex items-center justify-end text-pink-600 dark:text-cyan-400 bg-stone-50 dark:bg-stone-800 px-3 py-1.5 border-2 border-stone-900 dark:border-stone-100 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff]">
                                        Rp{new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(p!.finalSalary)}
                                    </div>
                                </div>
                            </td>
                            <td className="hidden md:table-cell px-6 py-4 font-extrabold text-stone-900 dark:text-white">{p!.hostName}</td>
                            <td className="hidden md:table-cell px-6 py-4 font-mono">{formatRupiah(p!.baseSalary)}</td>
                            <td className="hidden md:table-cell px-6 py-4 text-green-600 dark:text-green-400 font-mono font-bold">{formatRupiah(p!.bonus)}</td>
                            <td className="hidden md:table-cell px-6 py-4 text-red-600 dark:text-red-400 font-mono">{formatRupiah(p!.deduction)}</td>
                            <td className="hidden md:table-cell px-6 py-4 font-extrabold text-purple-700 dark:text-cyan-400 font-mono">{formatRupiah(p!.finalSalary)}</td>
                            <td className="hidden md:table-cell px-6 py-4 text-center"><button onClick={(e) => { e.stopPropagation(); onViewDetail(p); }} className="font-bold text-pink-500 hover:text-pink-700 dark:text-cyan-400 dark:hover:text-cyan-300">Rincian</button></td>
                        </tr>
                    )) : (
                        <tr><td colSpan={6} className="text-center py-8 text-stone-500 dark:text-stone-400">Tidak ada data gaji untuk ditampilkan.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

function TransferAssistant({ month, year }: { month: number, year: number }) {
    const { data, showNotification } = useContext(AppContext) as AppContextType;
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const payrolls = useMemo(() => {
        return data.hosts
            .filter(host => host.status === 'Aktif')
            .map(host => calculatePayroll(host.id, year, month, data.hosts, data.rekapLive))
            .filter(p => p !== null);
    }, [data.hosts, data.rekapLive, year, month]);

    const isHostPaid = (hostId: number) => {
        return data.payouts?.some(p => p.host_id === hostId && p.year === year && p.month === month);
    };

    const toggleChecked = async (hostId: number) => {
        try {
            const existing = data.payouts?.find(p => p.host_id === hostId && p.year === year && p.month === month);
            if (existing) {
                // Hapus rekam pembayaran (set unpaid)
                const { error } = await supabase.from('payouts').delete().eq('id', existing.id);
                if (error) throw error;
                showNotification('Status pembayaran dibatalkan.');
            } else {
                // Tambah rekam pembayaran (set paid)
                const { error } = await supabase.from('payouts').insert({
                    host_id: hostId,
                    year: year,
                    month: month,
                    is_paid: true
                });
                if (error) throw error;
                showNotification('Pembayaran berhasil ditandai.');
            }
        } catch (error: any) {
            console.error("Error toggling payout status:", error);
            showNotification(`Gagal mengubah status: ${error.message}`, true);
        }
    };

    const resetAll = async () => {
        if (window.confirm('Apakah Anda yakin ingin menyetel ulang semua status transfer untuk bulan ini di database?')) {
            try {
                const hostIds = payrolls.map(p => p!.hostId);
                if (hostIds.length === 0) return;

                const { error } = await supabase.from('payouts')
                    .delete()
                    .eq('year', year)
                    .eq('month', month)
                    .in('host_id', hostIds);

                if (error) throw error;
                showNotification('Semua status pembayaran berhasil disetel ulang.');
            } catch (error: any) {
                console.error("Error resetting payouts:", error);
                showNotification(`Gagal menyetel ulang: ${error.message}`, true);
            }
        }
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 1500);
    };

    const handleCopyAllPending = () => {
        const pendingPayrolls = payrolls.filter(p => !isHostPaid(p!.hostId));
        if (pendingPayrolls.length === 0) {
            alert('Semua transfer untuk bulan ini sudah selesai ditandai!');
            return;
        }

        const periodName = new Date(year, month).toLocaleString('id-ID', { month: 'long', year: 'numeric' });
        let text = `REKAP PEMBAYARAN GAJI HOST - ${periodName.toUpperCase()}\n`;
        text += `=====================================\n\n`;

        pendingPayrolls.forEach((p, index) => {
            text += `${index + 1}. ${p!.hostName}\n`;
            text += `   Bank: ${p!.bankName} (${p!.bankAccountNumber})\n`;
            text += `   Nominal: Rp ${p!.finalSalary.toLocaleString('id-ID')}\n\n`;
        });

        const totalPending = pendingPayrolls.reduce((sum, p) => sum + p!.finalSalary, 0);
        text += `=====================================\n`;
        text += `Total Belum Ditransfer: Rp ${totalPending.toLocaleString('id-ID')}`;

        navigator.clipboard.writeText(text);
        setCopiedId('copy-all-pending');
        setTimeout(() => setCopiedId(null), 1500);
    };

    const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

    const stats = useMemo(() => {
        const total = payrolls.length;
        const completed = payrolls.filter(p => isHostPaid(p!.hostId)).length;
        const pending = total - completed;
        const totalAmount = payrolls.reduce((sum, p) => sum + p!.finalSalary, 0);
        const completedAmount = payrolls.reduce((sum, p) => sum + (isHostPaid(p!.hostId) ? p!.finalSalary : 0), 0);
        const pendingAmount = totalAmount - completedAmount;

        return { total, completed, pending, totalAmount, completedAmount, pendingAmount };
    }, [payrolls, data.payouts, year, month]);

    return (
        <div className="space-y-6">
            {/* STATS OVERVIEW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border-[3px] border-stone-900 dark:border-stone-100 shadow-[4px_4px_0px_#ec4899] dark:shadow-[4px_4px_0px_#06b6d4] transition-all duration-300 hover:translate-y-[-2px]">
                    <h3 className="text-xs font-extrabold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Status Transfer Host</h3>
                    <div className="flex items-end justify-between mt-3">
                        <div>
                            <span className="text-3xl font-extrabold text-stone-900 dark:text-white font-mono">{stats.completed}</span>
                            <span className="text-xs text-stone-500 dark:text-stone-400 font-extrabold uppercase"> / {stats.total} Selesai</span>
                        </div>
                        <span className="text-xs px-2.5 py-1 font-extrabold bg-pink-100 text-pink-750 border-2 border-stone-900 dark:border-stone-100 dark:bg-cyan-950 dark:text-cyan-400 shadow-[1.5px_1.5px_0px_#000] dark:shadow-[1.5px_1.5px_0px_#fff]">
                            {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% PAID
                        </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-stone-100 dark:bg-stone-950 border-2 border-stone-900 dark:border-stone-600 h-3 rounded-none mt-4 overflow-hidden p-0.5 shadow-[1.5px_1.5px_0px_#000] dark:shadow-[1.5px_1.5px_0px_#fff]">
                        <div 
                            className="unity-gradient-bg h-full rounded-none transition-all duration-500 animate-pulse" 
                            style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
                        ></div>
                    </div>
                </div>

                <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border-[3px] border-stone-900 dark:border-stone-100 shadow-[4px_4px_0px_#ec4899] dark:shadow-[4px_4px_0px_#06b6d4] transition-all duration-300 hover:translate-y-[-2px]">
                    <h3 className="text-xs font-extrabold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Total Dana Terbayar</h3>
                    <p className="text-2xl font-extrabold text-green-600 dark:text-green-400 mt-2 font-mono">{formatRupiah(stats.completedAmount)}</p>
                    <p className="text-xs font-bold text-stone-500 dark:text-stone-400 mt-1">Dari total {formatRupiah(stats.totalAmount)}</p>
                </div>

                <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border-[3px] border-stone-900 dark:border-stone-100 shadow-[4px_4px_0px_#ec4899] dark:shadow-[4px_4px_0px_#06b6d4] transition-all duration-300 hover:translate-y-[-2px]">
                    <h3 className="text-xs font-extrabold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Sisa Dana Belum Ditransfer</h3>
                    <p className="text-2xl font-extrabold text-red-500 dark:text-red-400 mt-2 font-mono">{formatRupiah(stats.pendingAmount)}</p>
                    <p className="text-xs font-bold text-stone-500 dark:text-stone-400 mt-1">{stats.pending} host tersisa</p>
                </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-pink-50/50 dark:bg-cyan-950/10 p-4 rounded-xl border-[3px] border-stone-900 dark:border-stone-100 shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff]">
                <div className="text-sm text-stone-700 dark:text-stone-300 flex-1">
                    💡 <span className="font-extrabold text-pink-600 dark:text-cyan-400">TIPS TINGKAT TINGGI:</span> Klik tombol salin (<Copy className="inline h-3.5 w-3.5 mx-0.5" />) di sebelah rekening/nominal untuk menyalin, lalu tempel langsung di mobile banking Anda.
                </div>
                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                    <button
                        onClick={handleCopyAllPending}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-extrabold rounded-lg text-white bg-pink-500 dark:bg-cyan-600 border-2 border-stone-900 dark:border-stone-100 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] hover:translate-y-[-2px] hover:translate-x-[-1px] active:translate-y-[1px] active:shadow-none transition-all"
                    >
                        {copiedId === 'copy-all-pending' ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                        {copiedId === 'copy-all-pending' ? 'Tersalin!' : 'Salin Rekap WA'}
                    </button>
                    <button
                        onClick={resetAll}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-extrabold rounded-lg text-stone-700 dark:text-stone-350 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 border-2 border-stone-900 dark:border-stone-600 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] hover:translate-y-[-2px] active:translate-y-[1px] active:shadow-none transition-all"
                        title="Reset semua status transfer"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Reset
                    </button>
                </div>
            </div>

            {/* LIST SECTION */}
            <div className="bg-white dark:bg-stone-900 border-[3px] border-stone-900 dark:border-stone-100 shadow-[5px_5px_0px_0px_#ec4899] dark:shadow-[5px_5px_0px_0px_#06b6d4] overflow-hidden transition-all duration-300 rounded-none">
                <div className="p-4 bg-stone-100 dark:bg-stone-800 border-b-[3px] border-stone-900 dark:border-stone-100 hidden md:grid grid-cols-12 text-xs font-extrabold uppercase tracking-widest text-stone-900 dark:text-stone-200">
                    <div className="col-span-3">Nama Host</div>
                    <div className="col-span-3">Informasi Rekening</div>
                    <div className="col-span-3 text-right">Nominal Transfer</div>
                    <div className="col-span-3 text-center">Status Pembayaran</div>
                </div>

                <div className="divide-y-2 divide-stone-900 dark:divide-stone-800">
                    {payrolls.length > 0 ? (
                        payrolls.map(p => {
                            const isChecked = isHostPaid(p!.hostId);
                            return (
                                <div 
                                    key={p!.hostId}
                                    className={`p-4 grid grid-cols-1 md:grid-cols-12 items-center gap-4 transition-all duration-300 ${isChecked ? 'bg-stone-50/50 dark:bg-stone-950/20 opacity-50' : 'bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800/40'}`}
                                >
                                    {/* Column 1: Host Name */}
                                    <div className="col-span-3">
                                        <div className="font-bold text-base md:text-sm text-stone-800 dark:text-white flex items-center gap-2">
                                            {isChecked && <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />}
                                            {p!.hostName}
                                        </div>
                                        {isChecked && (
                                            <span className="inline-flex mt-1 items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                                                Transfer Berhasil
                                            </span>
                                        )}
                                    </div>

                                    {/* Column 2: Account Info */}
                                    <div className="col-span-3 space-y-1">
                                        <div className="text-xs text-stone-500 dark:text-stone-400 font-semibold uppercase">{p!.bankName}</div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-mono font-bold text-stone-700 dark:text-stone-300">{p!.bankAccountNumber}</span>
                                            {p!.bankAccountNumber !== '-' && (
                                                <button
                                                    onClick={() => handleCopy(p!.bankAccountNumber, `acc-${p!.hostId}`)}
                                                    className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-800 transition-colors"
                                                    title="Salin Nomor Rekening"
                                                >
                                                    {copiedId === `acc-${p!.hostId}` ? (
                                                        <Check className="h-3.5 w-3.5 text-green-500" />
                                                    ) : (
                                                        <Copy className="h-3.5 w-3.5" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Column 3: Transfer Amount */}
                                    <div className="col-span-3 md:text-right flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-none pt-2 md:pt-0">
                                        <span className="text-xs text-stone-500 dark:text-stone-400 md:hidden">Nominal Transfer:</span>
                                        <div className="flex items-center gap-2 justify-end">
                                            <span className={`text-lg md:text-sm font-extrabold ${isChecked ? 'text-stone-600 dark:text-stone-400' : 'text-purple-700 dark:text-cyan-400'}`}>
                                                {formatRupiah(p!.finalSalary)}
                                            </span>
                                            <button
                                                onClick={() => handleCopy(String(p!.finalSalary), `amt-${p!.hostId}`)}
                                                className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-800 transition-colors"
                                                title="Salin Nominal (Hanya Angka)"
                                            >
                                                {copiedId === `amt-${p!.hostId}` ? (
                                                    <Check className="h-3.5 w-3.5 text-green-500" />
                                                ) : (
                                                    <Copy className="h-3.5 w-3.5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Column 4: Checkbox Toggle */}
                                    <div className="col-span-3 flex justify-end md:justify-center border-t border-dashed border-stone-200 dark:border-stone-800 md:border-none pt-3 md:pt-0">
                                        <button
                                            onClick={() => toggleChecked(p!.hostId)}
                                            className={`w-full md:w-auto px-4 py-2 md:py-1.5 border-2 border-stone-900 dark:border-stone-100 text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-none ${
                                                isChecked 
                                                    ? 'bg-green-400 text-stone-900' 
                                                    : 'bg-pink-500 text-white dark:bg-cyan-500 dark:text-stone-950'
                                            }`}
                                        >
                                            {isChecked ? 'Sudah Ditransfer ✓' : 'Tandai Sudah Ditransfer 💸'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-12 text-stone-500 dark:text-stone-400">Tidak ada data gaji host yang aktif untuk bulan ini.</div>
                    )}
                </div>
            </div>
        </div>
    );
}

function PayrollDetailModal({ isOpen, onClose, payrollData, period }: { isOpen: boolean, onClose: () => void, payrollData: any, period: string }) {
    const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
    const formatDiamond = (num: number) => new Intl.NumberFormat().format(num);
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Rincian Gaji: ${payrollData.hostName}`}>
            <p className="text-center -mt-3 mb-6 text-sm font-extrabold tracking-wide uppercase bg-pink-100 dark:bg-cyan-950 text-stone-900 dark:text-stone-100 py-1 border-2 border-stone-900 dark:border-stone-500 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff]">{period}</p>
            <div className="space-y-6 text-sm">
                <div className="bg-stone-50 dark:bg-stone-950 p-4 border-[3px] border-stone-900 dark:border-stone-100 shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff]">
                    <h3 className="font-extrabold text-stone-900 dark:text-stone-100 uppercase tracking-wider mb-3 border-b-2 border-stone-900 dark:border-stone-800 pb-2">Gaji Pokok 💰</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-stone-500 dark:text-stone-400 font-bold">Gaji Pokok Awal:</span><span className="font-bold text-stone-900 dark:text-white font-mono">{formatRupiah(payrollData.baseSalary)}</span></div>
                        <div className="flex justify-between"><span className="text-stone-500 dark:text-stone-400 font-bold">Pencapaian Jam:</span><span className="font-bold text-stone-900 dark:text-white font-mono">{`${payrollData.totalHours.toFixed(2)} jam / ${payrollData.targetHours} jam`}</span></div>
                        <div className="flex justify-between"><span className="text-stone-500 dark:text-stone-400 font-bold">Pencapaian Hari:</span><span className="font-bold text-stone-900 dark:text-white font-mono">{`${payrollData.workDays} hari / ${payrollData.targetDays} hari`}</span></div>
                        <div className="flex justify-between"><span className="text-stone-500 dark:text-stone-400 font-bold">Potongan Kinerja:</span><span className="font-bold text-red-600 dark:text-red-400 font-mono">{formatRupiah(payrollData.deduction)}</span></div>
                        <div className="flex justify-between border-t-2 border-dashed border-stone-300 dark:border-stone-800 pt-2"><span className="font-extrabold text-stone-900 dark:text-stone-200">Gaji Pokok Disesuaikan:</span><span className="font-extrabold text-stone-900 dark:text-white font-mono">{formatRupiah(payrollData.adjustedBaseSalary)}</span></div>
                    </div>
                </div>
                
                <div className="bg-stone-50 dark:bg-stone-950 p-4 border-[3px] border-stone-900 dark:border-stone-100 shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff]">
                    <h3 className="font-extrabold text-stone-900 dark:text-stone-100 uppercase tracking-wider mb-3 border-b-2 border-stone-900 dark:border-stone-800 pb-2">Bonus Kinerja 💎</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-stone-500 dark:text-stone-400 font-bold">Total Diamond Tercapai:</span><span className="font-bold text-stone-900 dark:text-white font-mono">{formatDiamond(payrollData.totalDiamonds)}</span></div>
                        <div className="flex justify-between border-t-2 border-dashed border-stone-300 dark:border-stone-800 pt-2"><span className="font-extrabold text-stone-900 dark:text-stone-200">Bonus Diamond:</span><span className="font-extrabold text-green-600 dark:text-green-400 font-mono">{formatRupiah(payrollData.bonus)}</span></div>
                    </div>
                </div>
                
                <div className="bg-pink-100 dark:bg-cyan-950 p-5 border-[3px] border-stone-900 dark:border-stone-100 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] mt-6">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                        <span className="text-sm font-extrabold text-stone-900 dark:text-stone-100 uppercase tracking-widest">GAJI AKHIR (Take Home Pay) 💸:</span>
                        <span className="text-xl font-extrabold text-pink-600 dark:text-cyan-400 font-mono">{formatRupiah(payrollData.finalSalary)}</span>
                    </div>
                </div>
            </div>
            <div className="flex justify-end pt-6 mt-6 border-t-2 border-dashed border-stone-300 dark:border-stone-800">
                <button 
                    type="button" 
                    onClick={onClose} 
                    className="px-6 py-2.5 text-sm font-extrabold text-white bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 border-2 border-stone-900 dark:border-stone-100 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] hover:translate-y-[-2px] active:translate-y-[1px] active:shadow-none transition-all uppercase"
                >
                    Tutup
                </button>
            </div>
        </Modal>
    );
}

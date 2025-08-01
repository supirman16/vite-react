import React, { useContext, useState, useMemo } from 'react';
import { AppContext, AppContextType } from '../App';
import { calculatePayroll } from './AnalysisPage'; // Meminjam fungsi kalkulasi

// Komponen ini adalah halaman Sistem Gaji untuk superadmin.
export default function PayrollPage() {
    const [month, setMonth] = useState(new Date().getMonth());
    const [year, setYear] = useState(new Date().getFullYear());

    const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

    return (
        <section>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100">Sistem Gaji Host</h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Lihat dan kelola laporan gaji bulanan untuk host.</p>
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
            <PayrollTable month={month} year={year} />
        </section>
    );
}

// Komponen Tabel Penggajian
function PayrollTable({ month, year }: { month: number, year: number }) {
    const { data } = useContext(AppContext) as AppContextType;

    const payrolls = useMemo(() => {
        return data.hosts
            .filter(host => host.status === 'Aktif')
            .map(host => calculatePayroll(host.id, year, month, data.hosts, data.rekapLive))
            .filter(p => p !== null);
    }, [data.hosts, data.rekapLive, year, month]);

    const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
    const formatDiamond = (num: number) => new Intl.NumberFormat().format(num);
    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}j ${remainingMinutes}m`;
    };

    return (
        <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 overflow-x-auto">
            <table className="w-full text-sm text-left text-stone-600 dark:text-stone-300">
                <thead className="hidden md:table-header-group text-xs text-stone-700 dark:text-stone-400 uppercase bg-stone-100 dark:bg-stone-700">
                    <tr>
                        <th scope="col" className="px-6 py-3">Nama Host</th>
                        <th scope="col" className="px-6 py-3">Total Jam</th>
                        <th scope="col" className="px-6 py-3">Total Diamond</th>
                        <th scope="col" className="px-6 py-3">Gaji Pokok</th>
                        <th scope="col" className="px-6 py-3">Bonus</th>
                        <th scope="col" className="px-6 py-3">Potongan</th>
                        <th scope="col" className="px-6 py-3">Gaji Akhir</th>
                        <th scope="col" className="px-6 py-3 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody className="block md:table-row-group">
                    {payrolls.length > 0 ? payrolls.map(p => (
                        <tr key={p!.hostName} className="block md:table-row bg-white dark:bg-stone-800 border-b dark:border-stone-700 mb-4 md:mb-0">
                            <td data-label="Nama Host:" className="mobile-label px-6 py-4 block md:table-cell font-medium text-stone-900 dark:text-white">{p!.hostName}</td>
                            <td data-label="Total Jam:" className="mobile-label px-6 py-4 block md:table-cell">{formatDuration(p!.totalHours * 60)}</td>
                            <td data-label="Total Diamond:" className="mobile-label px-6 py-4 block md:table-cell">{formatDiamond(p!.totalDiamonds)}</td>
                            <td data-label="Gaji Pokok:" className="mobile-label px-6 py-4 block md:table-cell">{formatRupiah(p!.baseSalary)}</td>
                            <td data-label="Bonus:" className="mobile-label px-6 py-4 block md:table-cell text-green-600 dark:text-green-400">{formatRupiah(p!.bonus)}</td>
                            <td data-label="Potongan:" className="mobile-label px-6 py-4 block md:table-cell text-red-600 dark:text-red-400">{formatRupiah(p!.deduction)}</td>
                            <td data-label="Gaji Akhir:" className="mobile-label px-6 py-4 block md:table-cell font-bold text-purple-700 dark:text-purple-500">{formatRupiah(p!.finalSalary)}</td>
                            <td data-label="Aksi:" className="mobile-label px-6 py-4 block md:table-cell text-right md:text-center">
                                <button className="font-medium text-purple-600 hover:underline dark:text-purple-500">Detail</button>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={8} className="text-center py-8 text-stone-500 dark:text-stone-400">
                                Tidak ada data gaji untuk ditampilkan.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

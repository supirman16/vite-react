import React from 'react';

interface RecentSessionsTableProps {
    rekapData: any[];
}

export default function RecentSessionsTable({ rekapData }: RecentSessionsTableProps) {
    const formatDiamond = (num: number) => new Intl.NumberFormat().format(num);
    const formatDuration = (minutes: number) => `${Math.floor(minutes / 60)}j ${minutes % 60}m`;
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div className="bg-white dark:bg-stone-900 rounded-xl border-[3px] border-stone-900 dark:border-stone-100 shadow-[5px_5px_0px_0px_#ec4899] dark:shadow-[5px_5px_0px_0px_#06b6d4] overflow-x-auto transition-all duration-300">
            <table className="w-full text-sm text-left text-stone-600 dark:text-stone-300">
                <thead className="text-xs text-stone-900 dark:text-stone-200 uppercase bg-stone-100 dark:bg-stone-800 border-b-[3px] border-stone-900 dark:border-stone-100 font-extrabold font-mono">
                    <tr>
                        <th scope="col" className="px-6 py-4">Tanggal Live</th>
                        <th scope="col" className="px-6 py-4">Durasi</th>
                        <th scope="col" className="px-6 py-4">Pendapatan (💎)</th>
                    </tr>
                </thead>
                <tbody>
                    {rekapData.map((rekap) => (
                        <tr key={rekap.id} className="bg-white dark:bg-stone-900 border-b-2 border-stone-900 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors">
                            <td className="px-6 py-4 font-bold text-stone-900 dark:text-white">{formatDate(rekap.tanggal_live)}</td>
                            <td className="px-6 py-4 font-mono font-bold">{formatDuration(rekap.durasi_menit)}</td>
                            <td className="px-6 py-4 font-mono text-lg font-bold">{formatDiamond(rekap.pendapatan)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
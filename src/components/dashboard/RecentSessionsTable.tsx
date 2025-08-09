import React from 'react';

interface RecentSessionsTableProps {
    rekapData: any[];
}

export default function RecentSessionsTable({ rekapData }: RecentSessionsTableProps) {
    const formatDiamond = (num: number) => new Intl.NumberFormat().format(num);
    const formatDuration = (minutes: number) => `${Math.floor(minutes / 60)}j ${minutes % 60}m`;
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 overflow-x-auto">
            <table className="w-full text-sm text-left text-stone-600 dark:text-stone-300">
                <thead className="text-xs text-stone-700 dark:text-stone-400 uppercase bg-stone-100 dark:bg-stone-700">
                    <tr>
                        <th scope="col" className="px-6 py-3">Tanggal Live</th>
                        <th scope="col" className="px-6 py-3">Durasi</th>
                        <th scope="col" className="px-6 py-3">Pendapatan (💎)</th>
                    </tr>
                </thead>
                <tbody>
                    {rekapData.map((rekap) => (
                        <tr key={rekap.id} className="bg-white dark:bg-stone-800 border-b dark:border-stone-700">
                            <td className="px-6 py-4 font-medium text-stone-900 dark:text-white">{formatDate(rekap.tanggal_live)}</td>
                            <td className="px-6 py-4">{formatDuration(rekap.durasi_menit)}</td>
                            <td className="px-6 py-4">{formatDiamond(rekap.pendapatan)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
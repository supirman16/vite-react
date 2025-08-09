import React, { useState, useMemo } from 'react';
import { ArrowUpDown, MessageSquareQuote } from 'lucide-react';

export interface HostPerformance {
    id: number;
    nama_host: string;
    totalMinutes: number;
    totalDiamonds: number;
    totalSessions: number;
    efficiency: number;
}

interface HostPerformanceTableProps {
    rekapData: any[];
    hosts: any[];
    onGetFeedback: (host: HostPerformance) => void;
}

export default function HostPerformanceTable({ rekapData, hosts, onGetFeedback }: HostPerformanceTableProps) {
    const [sortConfig, setSortConfig] = useState<{ key: keyof HostPerformance; direction: 'asc' | 'desc' }>({ key: 'totalDiamonds', direction: 'desc' });
    
    const performanceData: HostPerformance[] = useMemo(() => {
        return hosts.map(host => {
            const hostRekap = rekapData.filter(r => r.host_id === host.id);
            const totalMinutes = hostRekap.reduce((sum, r) => sum + r.durasi_menit, 0);
            const totalDiamonds = hostRekap.reduce((sum, r) => sum + r.pendapatan, 0);
            const totalHours = totalMinutes / 60;
            return { id: host.id, nama_host: host.nama_host, totalMinutes, totalDiamonds, totalSessions: hostRekap.length, efficiency: totalHours > 0 ? Math.round(totalDiamonds / totalHours) : 0 };
        });
    }, [rekapData, hosts]);

    const sortedPerformanceData = useMemo(() => {
        return [...performanceData].sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [performanceData, sortConfig]);

    const handleSort = (key: keyof HostPerformance) => {
        setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));
    };

    const SortableHeader = ({ tKey, tLabel }: { tKey: keyof HostPerformance, tLabel: string }) => (
        <th scope="col" className="px-6 py-3 cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-700" onClick={() => handleSort(tKey)}>
            <div className="flex items-center">{tLabel}{sortConfig.key === tKey && <ArrowUpDown className="ml-2 h-4 w-4" />}</div>
        </th>
    );

    const formatDiamond = (num: number) => new Intl.NumberFormat().format(num);
    const formatDuration = (minutes: number) => `${Math.floor(minutes / 60)}j ${minutes % 60}m`;

    return (
        <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 overflow-x-auto">
            <h2 className="text-xl font-semibold p-6">Tabel Performa Host</h2>
            <table className="w-full text-sm text-left text-stone-600 dark:text-stone-300">
                <thead className="text-xs text-stone-700 dark:text-stone-400 uppercase bg-stone-100 dark:bg-stone-700">
                    <tr>
                        <th scope="col" className="px-6 py-3">Peringkat</th>
                        <SortableHeader tKey="nama_host" tLabel="Nama Host" />
                        <SortableHeader tKey="totalDiamonds" tLabel="Total Diamond" />
                        <SortableHeader tKey="efficiency" tLabel="Efisiensi (💎/jam)" />
                        <SortableHeader tKey="totalMinutes" tLabel="Total Jam Live" />
                        <th scope="col" className="px-6 py-3">Aksi AI</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedPerformanceData.map((host, index) => (
                        <tr key={host.id} className="bg-white dark:bg-stone-800 border-b dark:border-stone-700">
                            <td className="px-6 py-4 text-center">{index + 1}</td>
                            <td className="px-6 py-4 font-medium text-stone-900 dark:text-white">{host.nama_host}</td>
                            <td className="px-6 py-4">{formatDiamond(host.totalDiamonds)}</td>
                            <td className="px-6 py-4">{formatDiamond(host.efficiency)}</td>
                            <td className="px-6 py-4">{formatDuration(host.totalMinutes)}</td>
                            <td className="px-6 py-4">
                                <button onClick={() => onGetFeedback(host)} className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 flex items-center text-sm font-semibold">
                                    <MessageSquareQuote className="h-4 w-4 mr-1.5" />
                                    Dapatkan Saran
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
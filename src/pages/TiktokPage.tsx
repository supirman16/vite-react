import { useContext, useState, useMemo } from 'react';
import { AppContext, AppContextType } from '../App';
import { Plus, MoreVertical, ArrowUpDown } from 'lucide-react';

// Komponen ini adalah halaman Manajemen Akun TikTok untuk superadmin.
export default function TiktokPage() {
    return (
        <section>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100">Manajemen Akun TikTok</h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Kelola akun TikTok yang digunakan untuk live.</p>
                </div>
                <button 
                    onClick={() => alert('Fungsi Tambah Akun TikTok akan dibuat selanjutnya.')} 
                    className="mt-4 sm:mt-0 unity-gradient-bg text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:opacity-90 flex items-center"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Tambah Akun Baru
                </button>
            </div>
            <TiktokTable />
        </section>
    );
}

// Komponen Tabel Akun TikTok
function TiktokTable() {
    const { data } = useContext(AppContext) as AppContextType;
    const [sortKey, setSortKey] = useState('username');
    const [sortDirection, setSortDirection] = useState('asc');

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    const sortedData = useMemo(() => {
        return [...data.tiktokAccounts].sort((a, b) => {
            const valA = a[sortKey];
            const valB = b[sortKey];
            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data.tiktokAccounts, sortKey, sortDirection]);

    const SortableHeader = ({ tKey, tLabel }: { tKey: string, tLabel: string }) => (
        <th scope="col" className="px-6 py-3 cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-700" onClick={() => handleSort(tKey)}>
            <div className="flex items-center">
                {tLabel}
                {sortKey === tKey && <ArrowUpDown className="ml-2 h-4 w-4" />}
            </div>
        </th>
    );

    return (
        <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 overflow-x-auto">
            <table className="w-full text-sm text-left text-stone-600 dark:text-stone-300">
                <thead className="hidden md:table-header-group text-xs text-stone-700 dark:text-stone-400 uppercase bg-stone-100 dark:bg-stone-700">
                    <tr>
                        <SortableHeader tKey="username" tLabel="Username TikTok" />
                        <SortableHeader tKey="status" tLabel="Status" />
                        <th scope="col" className="px-6 py-3 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody className="block md:table-row-group">
                    {sortedData.map(account => (
                        <tr key={account.id} className="block md:table-row bg-white dark:bg-stone-800 border-b dark:border-stone-700 mb-4 md:mb-0">
                            <td data-label="Username:" className="mobile-label px-6 py-4 block md:table-cell font-medium text-stone-900 dark:text-white">{account.username}</td>
                            <td data-label="Status:" className="mobile-label px-6 py-4 block md:table-cell">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${account.status === 'Aktif' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                                    {account.status}
                                </span>
                            </td>
                            <td data-label="Aksi:" className="mobile-label px-6 py-4 block md:table-cell text-right md:text-center">
                                <button className="p-2 rounded-md hover:bg-stone-100 dark:hover:bg-stone-700">
                                    <MoreVertical className="h-5 w-5" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

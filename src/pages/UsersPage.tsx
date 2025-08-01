import { useContext, useState, useMemo } from 'react';
import { AppContext, AppContextType } from '../App';
import { Plus, MoreVertical, ArrowUpDown } from 'lucide-react';

// Komponen ini adalah halaman Manajemen Pengguna untuk superadmin.
export default function UsersPage() {
    return (
        <section>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100">Manajemen Pengguna</h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Kelola akun login untuk superadmin dan host.</p>
                </div>
                <button 
                    onClick={() => alert('Fungsi Tambah Pengguna akan dibuat selanjutnya.')} 
                    className="mt-4 sm:mt-0 unity-gradient-bg text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:opacity-90 flex items-center"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Tambah Pengguna Baru
                </button>
            </div>
            <UsersTable />
        </section>
    );
}

// Komponen Tabel Pengguna
function UsersTable() {
    const { data } = useContext(AppContext) as AppContextType;
    const [sortKey, setSortKey] = useState('email');
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
        return [...data.users].sort((a, b) => {
            const valA = a.email; // Sorting by email
            const valB = b.email;
            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data.users, sortKey, sortDirection]);

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
                        <SortableHeader tKey="email" tLabel="Email" />
                        <th scope="col" className="px-6 py-3">Peran</th>
                        <th scope="col" className="px-6 py-3">Terhubung ke Host</th>
                        <th scope="col" className="px-6 py-3 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody className="block md:table-row-group">
                    {sortedData.map(user => {
                        const host = data.hosts.find(h => h.id === user.user_metadata.host_id);
                        return (
                            <tr key={user.id} className="block md:table-row bg-white dark:bg-stone-800 border-b dark:border-stone-700 mb-4 md:mb-0">
                                <td data-label="Email:" className="mobile-label px-6 py-4 block md:table-cell font-medium text-stone-900 dark:text-white">{user.email}</td>
                                <td data-label="Peran:" className="mobile-label px-6 py-4 block md:table-cell">{user.user_metadata.role}</td>
                                <td data-label="Host:" className="mobile-label px-6 py-4 block md:table-cell">{host ? host.nama_host : '-'}</td>
                                <td data-label="Aksi:" className="mobile-label px-6 py-4 block md:table-cell text-right md:text-center">
                                    <button className="p-2 rounded-md hover:bg-stone-100 dark:hover:bg-stone-700">
                                        <MoreVertical className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

import { useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { AppContext, AppContextType, supabase } from '../App';
import { Plus, Edit, Trash2, ArrowUpDown, Search, RefreshCw } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import DropdownMenu from '../components/DropdownMenu';
import Skeleton from '../components/Skeleton';

// --- KONFIGURASI EULERSTREAM (REST API) ---
// Menggunakan endpoint yang sudah terverifikasi benar
const EULER_STREAM_API_URL = "https://tiktok.eulerstream.com/api/v1/user/"; 
const EULER_STREAM_API_KEY = "ZTlhMTg4YzcyMTRhNWY1ZTk2ZTNkODcwYTE0YTQyMDcwNGFiMGIwYjc4MmZmMjljZGE1ZmEw";

// Komponen ini adalah halaman Manajemen Akun TikTok untuk superadmin.
export default function TiktokPage() {
    const { setData, showNotification } = useContext(AppContext) as AppContextType;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
    const [accountToDelete, setAccountToDelete] = useState<any | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const handleAdd = () => {
        setSelectedAccount(null);
        setIsModalOpen(true);
    };

    const handleEdit = (account: any) => {
        setSelectedAccount(account);
        setIsModalOpen(true);
    };

    const handleDelete = (account: any) => {
        setAccountToDelete(account);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!accountToDelete) return;
        try {
            const { error } = await supabase.from('tiktok_accounts').delete().eq('id', accountToDelete.id);
            if (error) throw error;
            
            setData(prev => ({
                ...prev,
                tiktokAccounts: prev.tiktokAccounts.filter(acc => acc.id !== accountToDelete.id)
            }));
            showNotification('Akun TikTok berhasil dihapus.');
        } catch (error: any) {
            showNotification(`Gagal menghapus: ${error.message}`, true);
        } finally {
            setIsConfirmOpen(false);
            setAccountToDelete(null);
        }
    };

    return (
        <section>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100">Manajemen Akun TikTok</h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Kelola akun TikTok yang digunakan untuk live.</p>
                </div>
                <button 
                    onClick={handleAdd} 
                    className="mt-4 sm:mt-0 unity-gradient-bg text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:opacity-90 flex items-center"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Tambah Akun Baru
                </button>
            </div>

            <div className="mb-4">
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-5 w-5 text-stone-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Cari akun berdasarkan username..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full rounded-md border-0 bg-white dark:bg-stone-800 py-2.5 pl-10 text-stone-900 dark:text-white shadow-sm ring-1 ring-inset ring-stone-300 dark:ring-stone-700 placeholder:text-stone-400 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm"
                    />
                </div>
            </div>

            <TiktokTable onEdit={handleEdit} onDelete={handleDelete} searchQuery={searchQuery} />

            {isModalOpen && (
                <TiktokModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    account={selectedAccount}
                />
            )}

            {isConfirmOpen && (
                <ConfirmationModal
                    isOpen={isConfirmOpen}
                    onClose={() => setIsConfirmOpen(false)}
                    onConfirm={handleConfirmDelete}
                    title="Konfirmasi Hapus"
                    message={`Apakah Anda yakin ingin menghapus akun "${accountToDelete?.username}"?`}
                />
            )}
        </section>
    );
}

// Komponen Tabel Akun TikTok
function TiktokTable({ onEdit, onDelete, searchQuery }: { onEdit: (account: any) => void, onDelete: (account: any) => void, searchQuery: string }) {
    const { data } = useContext(AppContext) as AppContextType;
    const [sortKey, setSortKey] = useState('username');
    const [sortDirection, setSortDirection] = useState('asc');
    const [liveStatuses, setLiveStatuses] = useState<{ [key: string]: boolean }>({});
    const [loadingStatuses, setLoadingStatuses] = useState(true);

    const filteredAndSortedData = useMemo(() => {
        const filtered = data.tiktokAccounts.filter(account => 
            account.username.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return [...filtered].sort((a, b) => {
            const valA = a[sortKey];
            const valB = b[sortKey];
            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data.tiktokAccounts, sortKey, sortDirection, searchQuery]);

    const checkAllStatuses = useCallback(async () => {
        setLoadingStatuses(true);
        const activeAccounts = filteredAndSortedData.filter(acc => acc.status === 'Aktif');
        
        const statusPromises = activeAccounts.map(async (account) => {
            try {
                // --- PERBAIKAN: Menambahkan '@' di depan username ---
                const response = await fetch(`${EULER_STREAM_API_URL}@${account.username}`, {
                    method: 'GET',
                    headers: { 'X-API-Key': EULER_STREAM_API_KEY }
                });
                if (!response.ok) return { username: account.username, isLive: false };
                const result = await response.json();
                return { username: account.username, isLive: result.is_live };
            } catch (error) {
                console.error(`Error fetching status for ${account.username}:`, error);
                return { username: account.username, isLive: false };
            }
        });

        const results = await Promise.all(statusPromises);

        const newStatuses: { [key: string]: boolean } = {};
        results.forEach(res => {
            newStatuses[res.username.toLowerCase()] = res.isLive;
        });
        setLiveStatuses(newStatuses);
        setLoadingStatuses(false);
    }, [filteredAndSortedData]);

    useEffect(() => {
        if (filteredAndSortedData.length > 0) {
            checkAllStatuses();
        } else {
            setLoadingStatuses(false);
        }
    }, [filteredAndSortedData, checkAllStatuses]);

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

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
            <div className="p-4 border-b dark:border-stone-700 flex justify-end">
                <button 
                    onClick={checkAllStatuses} 
                    disabled={loadingStatuses}
                    className="text-sm bg-stone-100 dark:bg-stone-700 px-3 py-2 rounded-lg flex items-center hover:bg-stone-200 dark:hover:bg-stone-600 disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loadingStatuses ? 'animate-spin' : ''}`} />
                    {loadingStatuses ? 'Memuat...' : 'Segarkan Status'}
                </button>
            </div>
            <table className="w-full text-sm text-left text-stone-600 dark:text-stone-300">
                <thead className="hidden md:table-header-group text-xs text-stone-700 dark:text-stone-400 uppercase bg-stone-100 dark:bg-stone-700">
                    <tr>
                        <SortableHeader tKey="username" tLabel="Username TikTok" />
                        <SortableHeader tKey="status" tLabel="Status" />
                        <th scope="col" className="px-6 py-3 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody className="block md:table-row-group">
                    {filteredAndSortedData.map(account => {
                        const isLive = liveStatuses[account.username.toLowerCase()] || false;
                        const actions = [
                            { label: 'Ubah', icon: Edit, onClick: () => onEdit(account), className: 'text-purple-600 dark:text-purple-400' },
                            { label: 'Hapus', icon: Trash2, onClick: () => onDelete(account), className: 'text-red-600 dark:text-red-400' }
                        ];
                        return (
                            <tr key={account.id} className="block md:table-row bg-white dark:bg-stone-800 border-b dark:border-stone-700 mb-4 md:mb-0">
                                <td data-label="Username:" className="mobile-label px-6 py-4 block md:table-cell font-medium text-stone-900 dark:text-white">
                                    <div className="flex items-center space-x-2">
                                        {loadingStatuses ? <Skeleton className="h-3 w-3 rounded-full" /> : (
                                            isLive && (
                                                <span className="live-badge" title="Sedang Live">
                                                    <span className="live-badge-ping"></span>
                                                </span>
                                            )
                                        )}
                                        <span>{account.username}</span>
                                    </div>
                                </td>
                                <td data-label="Status:" className="mobile-label px-6 py-4 block md:table-cell">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${account.status === 'Aktif' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                                        {account.status}
                                    </span>
                                </td>
                                <td data-label="Aksi:" className="mobile-label px-6 py-4 block md:table-cell text-right md:text-center">
                                    <DropdownMenu actions={actions} />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}


// Komponen Modal untuk Tambah/Ubah Akun TikTok
function TiktokModal({ isOpen, onClose, account }: { isOpen: boolean, onClose: () => void, account: any | null }) {
    const { setData, showNotification } = useContext(AppContext) as AppContextType;
    const [formData, setFormData] = useState({
        username: account?.username || '',
        status: account?.status || 'Aktif',
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (account) { // Update
                const { data: updatedAccount, error } = await supabase.from('tiktok_accounts').update(formData).eq('id', account.id).select().single();
                if (error) throw error;
                setData(prev => ({ ...prev, tiktokAccounts: prev.tiktokAccounts.map(acc => acc.id === account.id ? updatedAccount : acc) }));
                showNotification('Akun TikTok berhasil diperbarui.');
            } else { // Insert
                const { data: newAccount, error } = await supabase.from('tiktok_accounts').insert(formData).select().single();
                if (error) throw error;
                setData(prev => ({ ...prev, tiktokAccounts: [...prev.tiktokAccounts, newAccount] }));
                showNotification('Akun TikTok baru berhasil ditambahkan.');
            }
            onClose();
        } catch (error: any) {
            showNotification(`Gagal menyimpan: ${error.message}`, true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={account ? 'Ubah Akun TikTok' : 'Tambah Akun TikTok Baru'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="username" className="block mb-2 text-sm font-medium">Username</label>
                    <input id="username" type="text" value={formData.username} onChange={handleChange} className="bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg block w-full p-2.5 dark:bg-stone-700 dark:border-stone-600" required />
                </div>
                <div>
                    <label htmlFor="status" className="block mb-2 text-sm font-medium">Status</label>
                    <select id="status" value={formData.status} onChange={handleChange} className="bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg block w-full p-2.5 dark:bg-stone-700 dark:border-stone-600">
                        <option value="Aktif">Aktif</option>
                        <option value="Tidak Aktif">Tidak Aktif</option>
                    </select>
                </div>
                <div className="flex justify-end space-x-4 pt-4">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-stone-700 bg-stone-100 rounded-lg hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300 dark:hover:bg-stone-600">Batal</button>
                    <button type="submit" disabled={loading} className="unity-gradient-bg text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:opacity-90 flex items-center justify-center disabled:opacity-75">
                        {loading ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

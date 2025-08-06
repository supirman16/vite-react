import { useContext, useState, useMemo } from 'react';
import { AppContext, AppContextType, supabase } from '../App';
import { Plus, Edit, Trash2, ArrowUpDown, Search } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import DropdownMenu from '../components/DropdownMenu';

// --- PERBAIKAN: Menambahkan kembali "export default" ---
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

function TiktokTable({ onEdit, onDelete, searchQuery }: { onEdit: (account: any) => void, onDelete: (account: any) => void, searchQuery: string }) {
    const { data } = useContext(AppContext) as AppContextType;
    const [sortKey, setSortKey] = useState('username');
    const [sortDirection, setSortDirection] = useState('asc');

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
                        const actions = [
                            { label: 'Ubah', icon: Edit, onClick: () => onEdit(account), className: 'text-purple-600 dark:text-purple-400' },
                            { label: 'Hapus', icon: Trash2, onClick: () => onDelete(account), className: 'text-red-600 dark:text-red-400' }
                        ];
                        return (
                            <tr key={account.id} className="block md:table-row bg-white dark:bg-stone-800 border-b dark:border-stone-700 mb-4 md:mb-0">
                                <td data-label="Username:" className="mobile-label px-6 py-4 block md:table-cell font-medium text-stone-900 dark:text-white">
                                    {account.username}
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

function TiktokModal({ isOpen, onClose, account }: { isOpen: boolean, onClose: () => void, account: any | null }) {
    const { setData, showNotification } = useContext(AppContext) as AppContextType;
    const [formData, setFormData] = useState({ username: account?.username || '', status: account?.status || 'Aktif' });
    const [loading, setLoading] = useState(false);
    const commonInputClasses = "bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 dark:bg-stone-700 dark:border-stone-600 dark:placeholder-stone-400 dark:text-white";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (account) {
                const { data: updatedAccount, error } = await supabase.from('tiktok_accounts').update(formData).eq('id', account.id).select().single();
                if (error) throw error;
                setData(prev => ({ ...prev, tiktokAccounts: prev.tiktokAccounts.map(acc => acc.id === account.id ? updatedAccount : acc) }));
                showNotification('Akun TikTok berhasil diperbarui.');
            } else {
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
                    <label htmlFor="username" className="block mb-2 text-sm font-medium text-stone-900 dark:text-stone-300">Username</label>
                    <input id="username" type="text" value={formData.username} onChange={handleChange} className={commonInputClasses} required />
                </div>
                <div>
                    <label htmlFor="status" className="block mb-2 text-sm font-medium text-stone-900 dark:text-stone-300">Status</label>
                    <select id="status" value={formData.status} onChange={handleChange} className={commonInputClasses}>
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

import { useContext, useState, useMemo } from 'react';
import { AppContext, AppContextType, supabase } from '../App';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';

// Komponen ini adalah halaman Manajemen Akun TikTok untuk superadmin.
export default function TiktokPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
    const [accountToDelete, setAccountToDelete] = useState<any | null>(null);

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
            
            const { setData, showNotification } = useContext(AppContext) as AppContextType;
            setData(prev => ({
                ...prev,
                tiktokAccounts: prev.tiktokAccounts.filter(acc => acc.id !== accountToDelete.id)
            }));
            showNotification('Akun TikTok berhasil dihapus.');
        } catch (error: any) {
            const { showNotification } = useContext(AppContext) as AppContextType;
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
            <TiktokTable onEdit={handleEdit} onDelete={handleDelete} />

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
function TiktokTable({ onEdit, onDelete }: { onEdit: (account: any) => void, onDelete: (account: any) => void }) {
    const { data } = useContext(AppContext) as AppContextType;

    return (
        <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 overflow-x-auto">
            <table className="w-full text-sm text-left text-stone-600 dark:text-stone-300">
                <thead className="hidden md:table-header-group text-xs text-stone-700 dark:text-stone-400 uppercase bg-stone-100 dark:bg-stone-700">
                    <tr>
                        <th scope="col" className="px-6 py-3">Username TikTok</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                        <th scope="col" className="px-6 py-3 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody className="block md:table-row-group">
                    {data.tiktokAccounts.map(account => (
                        <tr key={account.id} className="block md:table-row bg-white dark:bg-stone-800 border-b dark:border-stone-700 mb-4 md:mb-0">
                            <td data-label="Username:" className="mobile-label px-6 py-4 block md:table-cell font-medium text-stone-900 dark:text-white">{account.username}</td>
                            <td data-label="Status:" className="mobile-label px-6 py-4 block md:table-cell">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${account.status === 'Aktif' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                                    {account.status}
                                </span>
                            </td>
                            <td data-label="Aksi:" className="mobile-label px-6 py-4 block md:table-cell text-right md:text-center space-x-2">
                                <button onClick={() => onEdit(account)} className="font-medium text-purple-600 hover:underline dark:text-purple-500 p-1"><Edit className="h-4 w-4 inline"/> Ubah</button>
                                <button onClick={() => onDelete(account)} className="font-medium text-red-600 hover:underline dark:text-red-500 p-1"><Trash2 className="h-4 w-4 inline"/> Hapus</button>
                            </td>
                        </tr>
                    ))}
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

// Komponen Modal Konfirmasi
function ConfirmationModal({ isOpen, onClose, onConfirm, title, message }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, title: string, message: string }) {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        await onConfirm();
        setLoading(false);
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <p className="text-sm text-stone-600 dark:text-stone-300 mt-2 mb-6">{message}</p>
            <div className="flex justify-end space-x-4">
                <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-stone-700 bg-stone-100 rounded-lg hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300 dark:hover:bg-stone-600">Batal</button>
                <button onClick={handleConfirm} disabled={loading} className="bg-red-600 text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:bg-red-700 flex items-center justify-center disabled:opacity-75">
                    {loading ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
            </div>
        </Modal>
    );
}

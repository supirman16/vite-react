import { useContext, useState, useMemo, useEffect } from 'react';
import { AppContext, AppContextType, supabase } from '../App';
import { Plus, Edit, Trash2, ArrowUpDown, Search } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import DropdownMenu from '../components/DropdownMenu';

// --- PERBAIKAN: Menambahkan kembali "export default" ---
export default function UsersPage() {
    const { setData, showNotification } = useContext(AppContext) as AppContextType;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [userToDelete, setUserToDelete] = useState<any | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const handleAdd = () => {
        setSelectedUser(null);
        setIsModalOpen(true);
    };

    const handleEdit = (user: any) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleDelete = (user: any) => {
        setUserToDelete(user);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!userToDelete) return;
        try {
            const { error } = await supabase.functions.invoke('delete-user', {
                body: { userId: userToDelete.id }
            });
            if (error) throw error;
            
            setData(prev => ({
                ...prev,
                users: prev.users.filter(u => u.id !== userToDelete.id)
            }));
            showNotification('Pengguna berhasil dihapus.');
        } catch (error: any) {
            showNotification(`Gagal menghapus: ${error.message}`, true);
        } finally {
            setIsConfirmOpen(false);
            setUserToDelete(null);
        }
    };

    return (
        <section>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100">Manajemen Pengguna</h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Kelola akun login untuk superadmin dan host.</p>
                </div>
                <button 
                    onClick={handleAdd} 
                    className="mt-4 sm:mt-0 unity-gradient-bg text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:opacity-90 flex items-center"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Tambah Pengguna Baru
                </button>
            </div>

            <div className="mb-4">
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-5 w-5 text-stone-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Cari pengguna berdasarkan email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full rounded-md border-0 bg-white dark:bg-stone-800 py-2.5 pl-10 text-stone-900 dark:text-white shadow-sm ring-1 ring-inset ring-stone-300 dark:ring-stone-700 placeholder:text-stone-400 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm"
                    />
                </div>
            </div>

            <UsersTable onEdit={handleEdit} onDelete={handleDelete} searchQuery={searchQuery} />

            {isModalOpen && (
                <UserModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    user={selectedUser}
                />
            )}

            {isConfirmOpen && (
                <ConfirmationModal
                    isOpen={isConfirmOpen}
                    onClose={() => setIsConfirmOpen(false)}
                    onConfirm={handleConfirmDelete}
                    title="Konfirmasi Hapus"
                    message={`Apakah Anda yakin ingin menghapus pengguna "${userToDelete?.email}"?`}
                />
            )}
        </section>
    );
}

// Komponen Tabel Pengguna
function UsersTable({ onEdit, onDelete, searchQuery }: { onEdit: (user: any) => void, onDelete: (user: any) => void, searchQuery: string }) {
    const { data, session } = useContext(AppContext) as AppContextType;
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

    const filteredAndSortedData = useMemo(() => {
        const filtered = data.users.filter(user => 
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return [...filtered].sort((a, b) => {
            const valA = a[sortKey];
            const valB = b[sortKey];
            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data.users, sortKey, sortDirection, searchQuery]);

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
                    {filteredAndSortedData.map(user => {
                        const host = data.hosts.find(h => h.id === user.user_metadata.host_id);
                        
                        const actions = [
                            { label: 'Ubah', icon: Edit, onClick: () => onEdit(user), className: 'text-purple-600 dark:text-purple-400' },
                        ];

                        if (session?.user?.id !== user.id) {
                            actions.push({ label: 'Hapus', icon: Trash2, onClick: () => onDelete(user), className: 'text-red-600 dark:text-red-400' });
                        }

                        return (
                            <tr key={user.id} className="block md:table-row bg-white dark:bg-stone-800 border-b dark:border-stone-700 mb-4 md:mb-0">
                                <td data-label="Email:" className="mobile-label px-6 py-4 block md:table-cell font-medium text-stone-900 dark:text-white">{user.email}</td>
                                <td data-label="Peran:" className="mobile-label px-6 py-4 block md:table-cell">{user.user_metadata.role}</td>
                                <td data-label="Host:" className="mobile-label px-6 py-4 block md:table-cell">{host ? host.nama_host : '-'}</td>
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

function UserModal({ isOpen, onClose, user }: { isOpen: boolean, onClose: () => void, user: any | null }) {
    const { data, setData, showNotification } = useContext(AppContext) as AppContextType;
    const [formData, setFormData] = useState({
        email: user?.email || '',
        password: '',
        role: user?.user_metadata?.role || 'host',
        host_id: user?.user_metadata?.host_id || '',
    });
    const [loading, setLoading] = useState(false);
    const commonInputClasses = "bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 dark:bg-stone-700 dark:border-stone-600 dark:placeholder-stone-400 dark:text-white";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    useEffect(() => {
        if (formData.role !== 'host') {
            setFormData(prev => ({ ...prev, host_id: '' }));
        }
    }, [formData.role]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (user) {
                const { data: updatedUser, error } = await supabase.functions.invoke('update-user-details', {
                    body: { 
                        userId: user.id, 
                        role: formData.role, 
                        host_id: formData.host_id ? parseInt(formData.host_id) : null,
                        password: formData.password || null
                    }
                });
                if (error) throw error;
                
                setData(prev => ({ ...prev, users: prev.users.map(u => u.id === user.id ? updatedUser.user : u) }));
                showNotification('Pengguna berhasil diperbarui.');

            } else {
                if (!formData.password) {
                    showNotification('Password wajib diisi untuk pengguna baru.', true);
                    setLoading(false);
                    return;
                }
                const { data: newUser, error } = await supabase.functions.invoke('create-user-with-role', {
                    body: { email: formData.email, password: formData.password, role: formData.role, host_id: formData.host_id ? parseInt(formData.host_id) : null }
                });
                if (error) throw error;
                setData(prev => ({ ...prev, users: [...prev.users, newUser.user] }));
                showNotification('Pengguna baru berhasil ditambahkan.');
            }
            onClose();
        } catch (error: any) {
            showNotification(`Gagal menyimpan: ${error.message}`, true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={user ? 'Ubah Pengguna' : 'Tambah Pengguna Baru'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="email" className="block mb-2 text-sm font-medium text-stone-900 dark:text-stone-300">Email</label>
                    <input id="email" type="email" value={formData.email} onChange={handleChange} disabled={!!user} className={`${commonInputClasses} disabled:opacity-50`} required />
                </div>
                <div>
                    <label htmlFor="password" className="block mb-2 text-sm font-medium text-stone-900 dark:text-stone-300">Password</label>
                    <input id="password" type="password" value={formData.password} onChange={handleChange} className={commonInputClasses} placeholder={user ? "Kosongkan jika tidak ingin diubah" : ""} />
                </div>
                <div>
                    <label htmlFor="role" className="block mb-2 text-sm font-medium text-stone-900 dark:text-stone-300">Peran</label>
                    <select id="role" value={formData.role} onChange={handleChange} className={commonInputClasses}>
                        <option value="host">Host</option>
                        <option value="superadmin">Superadmin</option>
                    </select>
                </div>
                {formData.role === 'host' && (
                    <div>
                        <label htmlFor="host_id" className="block mb-2 text-sm font-medium text-stone-900 dark:text-stone-300">Hubungkan ke Host</label>
                        <select id="host_id" value={formData.host_id} onChange={handleChange} className={commonInputClasses}>
                            <option value="">Pilih Host</option>
                            {data.hosts.map(h => <option key={h.id} value={h.id}>{h.nama_host}</option>)}
                        </select>
                    </div>
                )}
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

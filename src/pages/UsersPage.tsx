import React, { useContext, useState, useMemo, useEffect } from 'react';
import { AppContext, AppContextType, supabase } from '../App';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';

// Komponen ini adalah halaman Manajemen Pengguna untuk superadmin.
export default function UsersPage() {
    const { showNotification, setData } = useContext(AppContext) as AppContextType;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [userToDelete, setUserToDelete] = useState<any | null>(null);

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
            <UsersTable onEdit={handleEdit} onDelete={handleDelete} />

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
function UsersTable({ onEdit, onDelete }: { onEdit: (user: any) => void, onDelete: (user: any) => void }) {
    const { data, session } = useContext(AppContext) as AppContextType;

    return (
        <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 overflow-x-auto">
            <table className="w-full text-sm text-left text-stone-600 dark:text-stone-300">
                <thead className="hidden md:table-header-group text-xs text-stone-700 dark:text-stone-400 uppercase bg-stone-100 dark:bg-stone-700">
                    <tr>
                        <th scope="col" className="px-6 py-3">Email</th>
                        <th scope="col" className="px-6 py-3">Peran</th>
                        <th scope="col" className="px-6 py-3">Terhubung ke Host</th>
                        <th scope="col" className="px-6 py-3 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody className="block md:table-row-group">
                    {data.users.map(user => {
                        const host = data.hosts.find(h => h.id === user.user_metadata.host_id);
                        return (
                            <tr key={user.id} className="block md:table-row bg-white dark:bg-stone-800 border-b dark:border-stone-700 mb-4 md:mb-0">
                                <td data-label="Email:" className="mobile-label px-6 py-4 block md:table-cell font-medium text-stone-900 dark:text-white">{user.email}</td>
                                <td data-label="Peran:" className="mobile-label px-6 py-4 block md:table-cell">{user.user_metadata.role}</td>
                                <td data-label="Host:" className="mobile-label px-6 py-4 block md:table-cell">{host ? host.nama_host : '-'}</td>
                                <td data-label="Aksi:" className="mobile-label px-6 py-4 block md:table-cell text-right md:text-center space-x-2">
                                    <button onClick={() => onEdit(user)} className="font-medium text-purple-600 hover:underline dark:text-purple-500 p-1"><Edit className="h-4 w-4 inline"/> Ubah</button>
                                    {session!.user.id !== user.id && (
                                        <button onClick={() => onDelete(user)} className="font-medium text-red-600 hover:underline dark:text-red-500 p-1"><Trash2 className="h-4 w-4 inline"/> Hapus</button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

// Komponen Modal untuk Tambah/Ubah Pengguna
function UserModal({ isOpen, onClose, user }: { isOpen: boolean, onClose: () => void, user: any | null }) {
    const { data, setData, showNotification } = useContext(AppContext) as AppContextType;
    const [formData, setFormData] = useState({
        email: user?.email || '',
        password: '',
        role: user?.user_metadata?.role || 'host',
        host_id: user?.user_metadata?.host_id || '',
    });
    const [loading, setLoading] = useState(false);

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
            if (user) { // Update
                const { data: updatedUser, error } = await supabase.functions.invoke('update-user-role', {
                    body: { userId: user.id, role: formData.role, host_id: formData.host_id ? parseInt(formData.host_id) : null }
                });
                if (error) throw error;
                
                setData(prev => ({ ...prev, users: prev.users.map(u => u.id === user.id ? updatedUser.user : u) }));
                showNotification('Pengguna berhasil diperbarui.');

            } else { // Insert
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
                    <label htmlFor="email" className="block mb-2 text-sm font-medium">Email</label>
                    <input id="email" type="email" value={formData.email} onChange={handleChange} disabled={!!user} className="bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg block w-full p-2.5 dark:bg-stone-700 dark:border-stone-600 disabled:opacity-50" required />
                </div>
                <div>
                    <label htmlFor="password">Password</label>
                    <input id="password" type="password" value={formData.password} onChange={handleChange} className="bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg block w-full p-2.5 dark:bg-stone-700 dark:border-stone-600" placeholder={user ? "Kosongkan jika tidak ingin diubah" : ""} />
                </div>
                <div>
                    <label htmlFor="role" className="block mb-2 text-sm font-medium">Peran</label>
                    <select id="role" value={formData.role} onChange={handleChange} className="bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg block w-full p-2.5 dark:bg-stone-700 dark:border-stone-600">
                        <option value="host">Host</option>
                        <option value="superadmin">Superadmin</option>
                    </select>
                </div>
                {formData.role === 'host' && (
                    <div>
                        <label htmlFor="host_id" className="block mb-2 text-sm font-medium">Hubungkan ke Host</label>
                        <select id="host_id" value={formData.host_id} onChange={handleChange} className="bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg block w-full p-2.5 dark:bg-stone-700 dark:border-stone-600">
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

import { useContext, useState, useMemo } from 'react';
import { AppContext, AppContextType, supabase } from '../App';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';

// Komponen ini adalah halaman Manajemen Host untuk superadmin.
export default function HostsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedHost, setSelectedHost] = useState<any | null>(null);
    const [hostToDelete, setHostToDelete] = useState<any | null>(null);

    const handleAdd = () => {
        setSelectedHost(null);
        setIsModalOpen(true);
    };

    const handleEdit = (host: any) => {
        setSelectedHost(host);
        setIsModalOpen(true);
    };

    const handleDelete = (host: any) => {
        setHostToDelete(host);
        setIsConfirmOpen(true);
    };

    return (
        <section>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100">Manajemen Data Host</h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Tambah, lihat, ubah, dan hapus data host Anda.</p>
                </div>
                <button 
                    onClick={handleAdd} 
                    className="mt-4 sm:mt-0 unity-gradient-bg text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:opacity-90 flex items-center"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Tambah Host Baru
                </button>
            </div>
            <HostsTable onEdit={handleEdit} onDelete={handleDelete} />

            {isModalOpen && (
                <HostModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    host={selectedHost}
                />
            )}

            {isConfirmOpen && (
                <ConfirmationModal
                    isOpen={isConfirmOpen}
                    onClose={() => setIsConfirmOpen(false)}
                    onConfirm={() => {
                        // Logika hapus akan ditambahkan di sini
                        setIsConfirmOpen(false);
                    }}
                    title="Konfirmasi Hapus"
                    message={`Apakah Anda yakin ingin menghapus host "${hostToDelete?.nama_host}"?`}
                />
            )}
        </section>
    );
}

// Komponen Tabel Host
function HostsTable({ onEdit, onDelete }: { onEdit: (host: any) => void, onDelete: (host: any) => void }) {
    const { data } = useContext(AppContext) as AppContextType;
    
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 overflow-x-auto">
            <table className="w-full text-sm text-left text-stone-600 dark:text-stone-300">
                <thead className="hidden md:table-header-group text-xs text-stone-700 dark:text-stone-400 uppercase bg-stone-100 dark:bg-stone-700">
                    <tr>
                        <th scope="col" className="px-6 py-3">Nama Host</th>
                        <th scope="col" className="px-6 py-3">Platform</th>
                        <th scope="col" className="px-6 py-3">Tgl Bergabung</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                        <th scope="col" className="px-6 py-3 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody className="block md:table-row-group">
                    {data.hosts.map(host => (
                        <tr key={host.id} className="block md:table-row bg-white dark:bg-stone-800 border-b dark:border-stone-700 mb-4 md:mb-0">
                            <td data-label="Nama Host:" className="mobile-label px-6 py-4 block md:table-cell font-medium text-stone-900 dark:text-white">{host.nama_host}</td>
                            <td data-label="Platform:" className="mobile-label px-6 py-4 block md:table-cell">{host.platform}</td>
                            <td data-label="Tgl Bergabung:" className="mobile-label px-6 py-4 block md:table-cell">{formatDate(host.tanggal_bergabung)}</td>
                            <td data-label="Status:" className="mobile-label px-6 py-4 block md:table-cell">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${host.status === 'Aktif' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                                    {host.status}
                                </span>
                            </td>
                            <td data-label="Aksi:" className="mobile-label px-6 py-4 block md:table-cell text-right md:text-center space-x-2">
                                <button onClick={() => onEdit(host)} className="font-medium text-purple-600 hover:underline dark:text-purple-500 p-1"><Edit className="h-4 w-4 inline"/> Ubah</button>
                                <button onClick={() => onDelete(host)} className="font-medium text-red-600 hover:underline dark:text-red-500 p-1"><Trash2 className="h-4 w-4 inline"/> Hapus</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Komponen Modal untuk Tambah/Ubah Host
function HostModal({ isOpen, onClose, host }: { isOpen: boolean, onClose: () => void, host: any | null }) {
    const { setData, showNotification } = useContext(AppContext) as AppContextType;
    const [formData, setFormData] = useState({
        nama_host: host?.nama_host || '',
        platform: host?.platform || '',
        tanggal_bergabung: host?.tanggal_bergabung || new Date().toISOString().split('T')[0],
        status: host?.status || 'Aktif',
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
            if (host) { // Update
                const { data: updatedHost, error } = await supabase.from('hosts').update(formData).eq('id', host.id).select().single();
                if (error) throw error;
                setData(prev => ({ ...prev, hosts: prev.hosts.map(h => h.id === host.id ? updatedHost : h) }));
                showNotification('Data host berhasil diperbarui.');
            } else { // Insert
                const { data: newHost, error } = await supabase.from('hosts').insert(formData).select().single();
                if (error) throw error;
                setData(prev => ({ ...prev, hosts: [...prev.hosts, newHost] }));
                showNotification('Host baru berhasil ditambahkan.');
            }
            onClose();
        } catch (error: any) {
            showNotification(`Gagal menyimpan: ${error.message}`, true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={host ? 'Ubah Data Host' : 'Tambah Host Baru'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* ... (Isi formulir seperti di bawah) ... */}
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
    const { setData, showNotification } = useContext(AppContext) as AppContextType;

    const handleConfirm = async () => {
        setLoading(true);
        try {
            // Logika hapus akan ditambahkan di sini
            showNotification('Host berhasil dihapus.');
            onConfirm(); // Ini akan memanggil fungsi yang memperbarui state di komponen induk
        } catch (error: any) {
            showNotification(`Gagal menghapus: ${error.message}`, true);
        } finally {
            setLoading(false);
            onClose();
        }
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

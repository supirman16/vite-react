import { useContext, useState, useMemo } from 'react';
import { AppContext, AppContextType, supabase } from '../App';
import { Plus, Edit, Trash2, ArrowUpDown, Search, User } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import DropdownMenu from '../components/DropdownMenu';
import ProfileEditor from '../components/ProfileEditor';

export default function HostsPage() {
    const { setData, showNotification } = useContext(AppContext) as AppContextType;
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [selectedHost, setSelectedHost] = useState<any | null>(null);
    const [hostToDelete, setHostToDelete] = useState<any | null>(null);
    const [hostForProfile, setHostForProfile] = useState<any | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showInactive, setShowInactive] = useState(false);

    const handleAdd = () => { setSelectedHost(null); setIsFormModalOpen(true); };
    const handleEdit = (host: any) => { setSelectedHost(host); setIsFormModalOpen(true); };
    const handleDelete = (host: any) => { setHostToDelete(host); setIsConfirmOpen(true); };
    const handleViewProfile = (host: any) => { setHostForProfile(host); setIsProfileModalOpen(true); };

    const handleConfirmDelete = async () => {
        if (!hostToDelete) return;
        try {
            const { error } = await supabase.from('hosts').delete().eq('id', hostToDelete.id);
            if (error) throw error;
            setData(prev => ({ ...prev, hosts: prev.hosts.filter(h => h.id !== hostToDelete.id) }));
            showNotification('Host berhasil dihapus.');
        } catch (error: any) {
            showNotification(`Gagal menghapus: ${error.message}`, true);
        } finally {
            setIsConfirmOpen(false);
            setHostToDelete(null);
        }
    };

    return (
        <section>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100">Manajemen Data Host</h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Tambah, lihat, ubah, dan hapus data host Anda.</p>
                </div>
                <button onClick={handleAdd} className="mt-4 sm:mt-0 unity-gradient-bg text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:opacity-90 flex items-center">
                    <Plus className="h-5 w-5 mr-2" />
                    Tambah Host Baru
                </button>
            </div>
            <div className="mb-4 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><Search className="h-5 w-5 text-stone-400" /></div>
                    <input type="text" placeholder="Cari host berdasarkan nama..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="block w-full rounded-md border-0 bg-white dark:bg-stone-800 py-2.5 pl-10 text-stone-900 dark:text-white shadow-sm ring-1 ring-inset ring-stone-300 dark:ring-stone-700 placeholder:text-stone-400 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm" />
                </div>
                <div className="flex items-center space-x-2">
                    <input id="show-inactive" type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="h-4 w-4 rounded border-stone-300 text-purple-600 focus:ring-purple-600" />
                    <label htmlFor="show-inactive" className="text-sm text-stone-600 dark:text-stone-300">Tampilkan host tidak aktif</label>
                </div>
            </div>
            <HostsTable onEdit={handleEdit} onDelete={handleDelete} onViewProfile={handleViewProfile} searchQuery={searchQuery} showInactive={showInactive} />
            {isFormModalOpen && <HostModal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} host={selectedHost} />}
            {isProfileModalOpen && hostForProfile && <Modal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} title={`Profil: ${hostForProfile.nama_host}`}><ProfileEditor hostId={hostForProfile.id} /></Modal>}
            {isConfirmOpen && <ConfirmationModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleConfirmDelete} title="Konfirmasi Hapus" message={`Apakah Anda yakin ingin menghapus host "${hostToDelete?.nama_host}"?`} />}
        </section>
    );
}

function HostsTable({ onEdit, onDelete, onViewProfile, searchQuery, showInactive }: { onEdit: (host: any) => void, onDelete: (host: any) => void, onViewProfile: (host: any) => void, searchQuery: string, showInactive: boolean }) {
    const { data } = useContext(AppContext) as AppContextType;
    const [sortKey, setSortKey] = useState('nama_host');
    const [sortDirection, setSortDirection] = useState('asc');

    const handleSort = (key: string) => {
        if (sortKey === key) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDirection('asc'); }
    };
    
    const filteredAndSortedData = useMemo(() => {
        const statusFiltered = showInactive ? data.hosts : data.hosts.filter(host => host.status === 'Aktif');
        const searchFiltered = statusFiltered.filter(host => host.nama_host.toLowerCase().includes(searchQuery.toLowerCase()));
        return [...searchFiltered].sort((a, b) => {
            const valA = a[sortKey]; const valB = b[sortKey];
            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data.hosts, sortKey, sortDirection, searchQuery, showInactive]);

    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const SortableHeader = ({ tKey, tLabel }: { tKey: string, tLabel: string }) => (<th scope="col" className="px-6 py-3 cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-700" onClick={() => handleSort(tKey)}><div className="flex items-center">{tLabel}{sortKey === tKey && <ArrowUpDown className="ml-2 h-4 w-4" />}</div></th>);

    return (
        <div className="bg-transparent md:bg-white/80 md:dark:bg-stone-900/80 md:backdrop-blur-sm rounded-xl md:shadow-lg md:border md:border-purple-300 md:dark:border-cyan-400/30 md:overflow-hidden">
            <table className="w-full text-sm text-left text-stone-600 dark:text-stone-300">
                <thead className="hidden md:table-header-group text-xs text-purple-600 dark:text-cyan-400 uppercase bg-stone-100 dark:bg-black/30">
                    <tr>
                        <SortableHeader tKey="nama_host" tLabel="Nama Host" />
                        <SortableHeader tKey="platform" tLabel="Platform" />
                        <SortableHeader tKey="tanggal_bergabung" tLabel="Tgl Bergabung" />
                        <SortableHeader tKey="status" tLabel="Status" />
                        <th scope="col" className="px-6 py-3 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody className="block md:table-row-group">
                    {filteredAndSortedData.map(host => {
                        const actions = [
                            { label: 'Lihat Profil', icon: User, onClick: () => onViewProfile(host), className: 'text-stone-700 dark:text-stone-300' },
                            { label: 'Ubah Data', icon: Edit, onClick: () => onEdit(host), className: 'text-purple-600 dark:text-purple-400' },
                            { label: 'Hapus', icon: Trash2, onClick: () => onDelete(host), className: 'text-red-600 dark:text-red-400' }
                        ];
                        return (
                            <tr key={host.id} className={`block md:table-row bg-white dark:bg-stone-800/80 border-b dark:border-stone-700 mb-4 md:mb-0 rounded-lg md:rounded-none shadow-lg md:shadow-none transition-opacity ${host.status === 'Tidak Aktif' ? 'opacity-60' : ''}`}>
                                <td className="p-4 md:hidden">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-grow overflow-hidden">
                                            <div className="font-bold text-lg text-stone-800 dark:text-white truncate">{host.nama_host}</div>
                                            <div className="text-xs text-stone-500">{host.platform} - Sejak {formatDate(host.tanggal_bergabung)}</div>
                                        </div>
                                        <div className="flex flex-col items-end space-y-2 flex-shrink-0 ml-4">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${host.status === 'Aktif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{host.status}</span>
                                            <DropdownMenu actions={actions} />
                                        </div>
                                    </div>
                                </td>
                                <td className="hidden md:table-cell px-6 py-4 font-medium text-stone-900 dark:text-white">{host.nama_host}</td>
                                <td className="hidden md:table-cell px-6 py-4">{host.platform}</td>
                                <td className="hidden md:table-cell px-6 py-4">{formatDate(host.tanggal_bergabung)}</td>
                                <td className="hidden md:table-cell px-6 py-4"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${host.status === 'Aktif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{host.status}</span></td>
                                <td className="hidden md:table-cell px-6 py-4 text-center"><DropdownMenu actions={actions} /></td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function HostModal({ isOpen, onClose, host }: { isOpen: boolean, onClose: () => void, host: any | null }) {
    const { setData, showNotification } = useContext(AppContext) as AppContextType;
    const [formData, setFormData] = useState({ nama_host: host?.nama_host || '', platform: host?.platform || '', tanggal_bergabung: host?.tanggal_bergabung || new Date().toISOString().split('T')[0], status: host?.status || 'Aktif' });
    const [loading, setLoading] = useState(false);
    const commonInputClasses = "bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 dark:bg-stone-700 dark:border-stone-600 dark:placeholder-stone-400 dark:text-white";
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { const { id, value } = e.target; setFormData(prev => ({ ...prev, [id]: value })); };
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); setLoading(true);
        try {
            if (host) {
                const { data: updatedHost, error } = await supabase.from('hosts').update(formData).eq('id', host.id).select().single();
                if (error) throw error;
                setData(prev => ({ ...prev, hosts: prev.hosts.map(h => h.id === host.id ? updatedHost : h) }));
                showNotification('Data host berhasil diperbarui.');
            } else {
                const { data: newHost, error } = await supabase.from('hosts').insert(formData).select().single();
                if (error) throw error;
                setData(prev => ({ ...prev, hosts: [...prev.hosts, newHost] }));
                showNotification('Host baru berhasil ditambahkan.');
            }
            onClose();
        } catch (error: any) {
            showNotification(`Gagal menyimpan: ${error.message}`, true);
        } finally { setLoading(false); }
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={host ? 'Ubah Data Host' : 'Tambah Host Baru'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div><label htmlFor="nama_host" className="block mb-2 text-sm font-medium text-stone-900 dark:text-stone-300">Nama Host</label><input id="nama_host" type="text" value={formData.nama_host} onChange={handleChange} className={commonInputClasses} required /></div>
                <div><label htmlFor="platform" className="block mb-2 text-sm font-medium text-stone-900 dark:text-stone-300">Platform</label><input id="platform" type="text" value={formData.platform} onChange={handleChange} className={commonInputClasses} required /></div>
                <div><label htmlFor="tanggal_bergabung" className="block mb-2 text-sm font-medium text-stone-900 dark:text-stone-300">Tanggal Bergabung</label><input id="tanggal_bergabung" type="date" value={formData.tanggal_bergabung} onChange={handleChange} className={commonInputClasses} required /></div>
                <div><label htmlFor="status" className="block mb-2 text-sm font-medium text-stone-900 dark:text-stone-300">Status</label><select id="status" value={formData.status} onChange={handleChange} className={commonInputClasses}><option value="Aktif">Aktif</option><option value="Tidak Aktif">Tidak Aktif</option></select></div>
                <div className="flex justify-end space-x-4 pt-4"><button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-stone-700 bg-stone-100 rounded-lg hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300 dark:hover:bg-stone-600">Batal</button><button type="submit" disabled={loading} className="unity-gradient-bg text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:opacity-90 flex items-center justify-center disabled:opacity-75">{loading ? 'Menyimpan...' : 'Simpan'}</button></div>
            </form>
        </Modal>
    );
}

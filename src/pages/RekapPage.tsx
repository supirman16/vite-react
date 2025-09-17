import { useContext, useState, useMemo, useEffect } from 'react';
import { AppContext, AppContextType, supabase } from '../App';
import { Plus, Check, XCircle, Edit, Trash2, Diamond } from 'lucide-react';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';
import ConfirmationModal from '../components/ConfirmationModal';

// Komponen ini adalah halaman Manajemen Rekap Live.
export default function RekapPage() {
    const { data, session, setData, showNotification } = useContext(AppContext) as AppContextType;
    const isSuperAdmin = session!.user.user_metadata?.role === 'superadmin';

    const [month, setMonth] = useState(new Date().getMonth());
    const [year, setYear] = useState(new Date().getFullYear());
    const [selectedHost, setSelectedHost] = useState('all');
    const [selectedTiktok, setSelectedTiktok] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');

    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [rekapToDelete, setRekapToDelete] = useState<any | null>(null);
    const [selectedRekap, setSelectedRekap] = useState<any | null>(null);

    const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

    const handleViewDetail = (rekap: any) => { setSelectedRekap(rekap); setIsDetailModalOpen(true); };
    const handleCloseDetail = () => { setIsDetailModalOpen(false); setSelectedRekap(null); };
    const handleAdd = () => { setSelectedRekap(null); setIsFormModalOpen(true); };
    const handleEdit = (rekap: any) => { setSelectedRekap(rekap); setIsDetailModalOpen(false); setIsFormModalOpen(true); };
    const handleDelete = (rekap: any) => { setRekapToDelete(rekap); setIsConfirmOpen(true); };

    const handleConfirmDelete = async () => {
        if (!rekapToDelete) return;
        try {
            const { error } = await supabase.from('rekap_live').delete().eq('id', rekapToDelete.id);
            if (error) throw error;
            setData(prevData => ({ ...prevData, rekapLive: prevData.rekapLive.filter(r => r.id !== rekapToDelete.id) }));
            showNotification('Rekap berhasil dihapus.');
        } catch (error: any) {
            showNotification(`Gagal menghapus rekap: ${error.message}`, true);
        } finally {
            setIsConfirmOpen(false);
            setRekapToDelete(null);
        }
    };

    const StatusButton = ({ status, label }: { status: string, label: string }) => ( <button onClick={() => setSelectedStatus(status)} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${selectedStatus === status ? 'unity-gradient-bg text-white' : 'bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200'}`}>{label}</button> );
    const commonSelectClasses = "bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 dark:bg-stone-700 dark:border-stone-600 dark:placeholder-stone-400 dark:text-white";

    return (
        <section>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <div>
                    <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100">Manajemen Rekap Live</h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Saring, lihat, dan kelola semua riwayat sesi live.</p>
                </div>
                <button onClick={handleAdd} className="mt-4 sm:mt-0 unity-gradient-bg font-semibold px-4 py-2.5 rounded-lg shadow-sm hover:opacity-90 flex items-center"><Plus className="h-5 w-5 mr-2" />Tambah Rekap</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm rounded-xl border border-purple-300 dark:border-cyan-400/30 shadow-lg">
                <div className="flex items-center space-x-2">
                    <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className={commonSelectClasses}>{months.map((m, i) => <option key={i} value={i}>{m}</option>)}</select>
                    <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className={commonSelectClasses}>{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
                </div>
                {isSuperAdmin && (
                    <>
                        <select value={selectedHost} onChange={(e) => setSelectedHost(e.target.value)} className={commonSelectClasses}><option value="all">Semua Host</option>{data.hosts.map(h => <option key={h.id} value={h.id}>{h.nama_host}</option>)}</select>
                        <select value={selectedTiktok} onChange={(e) => setSelectedTiktok(e.target.value)} className={commonSelectClasses}><option value="all">Semua Akun</option>{data.tiktokAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.username}</option>)}</select>
                    </>
                )}
                <div className="flex items-center space-x-2 p-1 bg-stone-100 dark:bg-stone-900 rounded-lg">
                    <StatusButton status="all" label="Semua" /><StatusButton status="pending" label="Pending" /><StatusButton status="approved" label="Approved" />
                </div>
            </div>
            <RekapTable filters={{ month, year, selectedHost, selectedTiktok, selectedStatus }} onViewDetail={handleViewDetail} onAdd={handleAdd} />
            {isDetailModalOpen && selectedRekap && <RekapDetailModal isOpen={isDetailModalOpen} onClose={handleCloseDetail} rekap={selectedRekap} onEdit={handleEdit} onDelete={handleDelete} />}
            {isFormModalOpen && <RekapModal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} rekap={selectedRekap} />}
            {isConfirmOpen && <ConfirmationModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleConfirmDelete} title="Konfirmasi Hapus" message={`Apakah Anda yakin ingin menghapus rekap ini?`} />}
        </section>
    );
}

function RekapTable({ filters, onViewDetail, onAdd }: { filters: any, onViewDetail: (rekap: any) => void, onAdd: () => void }) {
    const { data, session } = useContext(AppContext) as AppContextType;
    const isSuperAdmin = session!.user.user_metadata?.role === 'superadmin';

    const filteredData = useMemo(() => {
        return data.rekapLive.filter(r => {
            const recDate = new Date(r.tanggal_live);
            const monthMatch = recDate.getMonth() === filters.month;
            const yearMatch = recDate.getFullYear() === filters.year;
            const hostMatch = isSuperAdmin ? (filters.selectedHost === 'all' || r.host_id === parseInt(filters.selectedHost)) : (r.host_id === session!.user.user_metadata.host_id);
            const tiktokMatch = filters.selectedTiktok === 'all' || r.tiktok_account_id === parseInt(filters.selectedTiktok);
            const statusMatch = filters.selectedStatus === 'all' || r.status === filters.selectedStatus;
            return monthMatch && yearMatch && hostMatch && tiktokMatch && statusMatch;
        }).sort((a, b) => new Date(b.tanggal_live).getTime() - new Date(a.tanggal_live).getTime());
    }, [data.rekapLive, filters, isSuperAdmin, session]);

    const formatDuration = (minutes: number) => `${Math.floor(minutes / 60)}j ${minutes % 60}m`;
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' });

    if (data.loading) return <RekapTableSkeleton isSuperAdmin={isSuperAdmin} />;
    if (filteredData.length === 0) return <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700"><EmptyState title="Belum Ada Rekap" message="Tidak ada data rekap live untuk ditampilkan pada periode ini. Coba buat yang baru." actionText="Tambah Rekap Baru" onActionClick={onAdd} /></div>;

    return (
        <div className="bg-transparent md:bg-white/80 md:dark:bg-stone-900/80 md:backdrop-blur-sm rounded-xl md:shadow-lg md:border md:border-purple-300 md:dark:border-cyan-400/30 md:overflow-hidden">
            <table className="w-full text-sm text-left text-stone-600 dark:text-stone-300">
                <thead className="hidden md:table-header-group text-xs text-purple-600 dark:text-cyan-400 uppercase bg-stone-100 dark:bg-black/30">
                    <tr>
                        <th scope="col" className="px-6 py-3">Tanggal</th>
                        {isSuperAdmin && <th scope="col" className="px-6 py-3">Host</th>}
                        <th scope="col" className="px-6 py-3">Akun TikTok</th>
                        <th scope="col" className="px-6 py-3">Durasi</th>
                        <th scope="col" className="px-6 py-3">Diamond</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                        <th scope="col" className="px-6 py-3 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody className="block md:table-row-group">
                    {filteredData.map(rekap => {
                        const host = data.hosts.find(h => h.id === rekap.host_id);
                        const tiktokAccount = data.tiktokAccounts.find(t => t.id === rekap.tiktok_account_id);
                        return (
                            <tr key={rekap.id} onClick={() => onViewDetail(rekap)} className="block md:table-row bg-white dark:bg-stone-800/80 border-b dark:border-stone-700 mb-4 md:mb-0 rounded-lg md:rounded-none shadow-lg md:shadow-none cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                                <td className="p-4 md:hidden">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-grow">
                                            <div className="font-bold text-lg text-stone-800 dark:text-white">{formatDate(rekap.tanggal_live)}</div>
                                            {isSuperAdmin && <div className="text-sm font-semibold text-stone-600 dark:text-stone-300">{host?.nama_host || 'N/A'}</div>}
                                            <div className="text-xs text-stone-500">@{tiktokAccount?.username || 'N/A'}</div>
                                        </div>
                                        <div className="flex flex-col items-end space-y-2 flex-shrink-0 ml-4">
                                            <div className="font-bold text-lg flex items-center text-purple-600 dark:text-cyan-400">
                                                <Diamond className="w-4 h-4 mr-1.5" />
                                                {new Intl.NumberFormat().format(rekap.pendapatan)}
                                            </div>
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${rekap.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}`}>
                                                {rekap.status}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="hidden md:table-cell px-6 py-4 font-medium text-stone-900 dark:text-white">{formatDate(rekap.tanggal_live)}</td>
                                {isSuperAdmin && <td className="hidden md:table-cell px-6 py-4 font-medium text-stone-900 dark:text-white">{host?.nama_host || 'N/A'}</td>}
                                <td className="hidden md:table-cell px-6 py-4">{tiktokAccount?.username || 'N/A'}</td>
                                <td className="hidden md:table-cell px-6 py-4">{formatDuration(rekap.durasi_menit)}</td>
                                <td className="hidden md:table-cell px-6 py-4">{new Intl.NumberFormat().format(rekap.pendapatan)}</td>
                                <td className="hidden md:table-cell px-6 py-4"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${rekap.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}`}>{rekap.status}</span></td>
                                <td className="hidden md:table-cell px-6 py-4 text-center"><button onClick={(e) => { e.stopPropagation(); onViewDetail(rekap); }} className="font-medium text-purple-600 hover:underline dark:text-purple-500">Lihat Detail</button></td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function RekapTableSkeleton({ isSuperAdmin }: { isSuperAdmin: boolean }) {
    return (
        <div className="space-y-4 md:space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-stone-800 p-4 rounded-lg shadow md:hidden">
                    <div className="flex justify-between items-center">
                        <div><Skeleton className="h-6 w-24 mb-1" /><Skeleton className="h-4 w-32" /></div>
                        <div className="text-right"><Skeleton className="h-6 w-20 mb-1" /><Skeleton className="h-5 w-16 rounded-full" /></div>
                    </div>
                </div>
            ))}
            <div className="hidden md:block bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 overflow-x-auto"></div>
        </div>
    );
}

function RekapDetailModal({ isOpen, onClose, rekap, onEdit, onDelete }: { isOpen: boolean, onClose: () => void, rekap: any, onEdit: (rekap: any) => void, onDelete: (rekap: any) => void }) {
    const { data, session, setData, showNotification } = useContext(AppContext) as AppContextType;
    const isSuperAdmin = session!.user.user_metadata?.role === 'superadmin';
    const host = data.hosts.find(h => h.id === rekap.host_id);
    const tiktokAccount = data.tiktokAccounts.find(t => t.id === rekap.tiktok_account_id);
    const formatDuration = (minutes: number) => `${Math.floor(minutes / 60)}j ${minutes % 60}m`;
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const formatDiamond = (num: number) => new Intl.NumberFormat().format(num);
    const handleStatusChange = async (newStatus: string) => {
        try {
            const { error } = await supabase.from('rekap_live').update({ status: newStatus }).eq('id', rekap.id);
            if (error) throw error;
            setData(prevData => ({ ...prevData, rekapLive: prevData.rekapLive.map(r => r.id === rekap.id ? { ...r, status: newStatus } : r) }));
            showNotification(`Status rekap berhasil diubah ke ${newStatus}.`);
            onClose();
        } catch (error: any) {
            showNotification(`Gagal mengubah status: ${error.message}`, true);
        }
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Detail Rekap Live`}>
            <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b pb-2 dark:border-stone-600"><span className="font-medium text-stone-500 dark:text-stone-400">Tanggal Live:</span> <span className="text-stone-900 dark:text-white font-semibold">{formatDate(rekap.tanggal_live)}</span></div>
                <div className="flex justify-between border-b pb-2 dark:border-stone-600"><span className="font-medium text-stone-500 dark:text-stone-400">Host:</span> <span className="text-stone-900 dark:text-white font-semibold">{host?.nama_host || 'N/A'}</span></div>
                <div className="flex justify-between border-b pb-2 dark:border-stone-600"><span className="font-medium text-stone-500 dark:text-stone-400">Akun TikTok:</span> <span className="text-stone-900 dark:text-white font-semibold">{tiktokAccount?.username || 'N/A'}</span></div>
                <div className="flex justify-between border-b pb-2 dark:border-stone-600"><span className="font-medium text-stone-500 dark:text-stone-400">Waktu:</span> <span className="text-stone-900 dark:text-white font-semibold">{rekap.waktu_mulai} - {rekap.waktu_selesai}</span></div>
                <div className="flex justify-between border-b pb-2 dark:border-stone-600"><span className="font-medium text-stone-500 dark:text-stone-400">Durasi:</span> <span className="text-stone-900 dark:text-white font-semibold">{formatDuration(rekap.durasi_menit)}</span></div>
                <div className="flex justify-between border-b pb-2 dark:border-stone-600"><span className="font-medium text-stone-500 dark:text-stone-400">Pendapatan:</span> <span className="text-stone-900 dark:text-white font-semibold">{formatDiamond(rekap.pendapatan)} 💎</span></div>
                <div className="mt-4"><p className="font-medium text-stone-500 dark:text-stone-400 mb-1">Catatan:</p><p className="text-stone-800 dark:text-stone-200 bg-stone-100 dark:bg-stone-700 p-3 rounded-md min-h-[50px]">{rekap.catatan || 'Tidak ada catatan.'}</p></div>
            </div>
            <div className="flex justify-end space-x-3 pt-4 mt-4 border-t dark:border-stone-600">
                {isSuperAdmin && rekap.status === 'pending' && (<><button onClick={() => handleStatusChange('approved')} className="text-sm font-medium text-green-600 hover:underline flex items-center"><Check className="h-4 w-4 mr-1"/>Approve</button><button onClick={() => handleStatusChange('rejected')} className="text-sm font-medium text-red-600 hover:underline flex items-center"><XCircle className="h-4 w-4 mr-1"/>Reject</button></>)}
                {isSuperAdmin && rekap.status === 'approved' && (<button onClick={() => handleStatusChange('pending')} className="text-sm font-medium text-yellow-600 hover:underline">Rollback</button>)}
                {rekap.status === 'pending' && (<><button onClick={() => onEdit(rekap)} className="text-sm font-medium text-purple-600 hover:underline flex items-center"><Edit className="h-4 w-4 mr-1"/>Ubah</button><button onClick={() => { onClose(); onDelete(rekap); }} className="text-sm font-medium text-red-600 hover:underline flex items-center"><Trash2 className="h-4 w-4 mr-1"/>Hapus</button></>)}
            </div>
        </Modal>
    );
}
// ==================================================================
// --- PERUBAHAN UTAMA ADA DI KOMPONEN MODAL DI BAWAH INI ---
// ==================================================================
function RekapModal({ isOpen, onClose, rekap }: { isOpen: boolean, onClose: () => void, rekap: any | null }) {
    const { data, session, setData, showNotification } = useContext(AppContext) as AppContextType;
    const isSuperAdmin = session!.user.user_metadata?.role === 'superadmin';
    const [formData, setFormData] = useState({ host_id: rekap?.host_id || (isSuperAdmin ? '' : session!.user.user_metadata.host_id), tiktok_account_id: rekap?.tiktok_account_id || '', tanggal_live: rekap?.tanggal_live || new Date().toISOString().split('T')[0], waktu_mulai: rekap?.waktu_mulai || '13:00', pendapatan: rekap?.pendapatan || '', catatan: rekap?.catatan || '' });
    const [duration, setDuration] = useState({ hours: '0', minutes: '0' });
    const [calculatedEndTime, setCalculatedEndTime] = useState('--:--');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (rekap && rekap.durasi_menit) {
            const hours = Math.floor(rekap.durasi_menit / 60);
            const minutes = rekap.durasi_menit % 60;
            setDuration({ hours: hours.toString(), minutes: minutes.toString() });
        } else {
            setDuration({ hours: '5', minutes: '0' });
        }
    }, [rekap]);

    useEffect(() => {
        const { waktu_mulai } = formData;
        const hours = parseInt(duration.hours, 10) || 0;
        const minutes = parseInt(duration.minutes, 10) || 0;
        if (waktu_mulai) {
            const [startHours, startMinutes] = waktu_mulai.split(':').map(Number);
            const startDate = new Date();
            startDate.setHours(startHours, startMinutes, 0, 0);
            const endDate = new Date(startDate.getTime() + (hours * 60 + minutes) * 60000);
            const endHours = String(endDate.getHours()).padStart(2, '0');
            const endMinutes = String(endDate.getMinutes()).padStart(2, '0');
            setCalculatedEndTime(`${endHours}:${endMinutes}`);
        }
    }, [formData.waktu_mulai, duration]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { const { id, value } = e.target; setFormData(prev => ({ ...prev, [id]: value })); };
    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => { const { id, value } = e.target; const sanitizedValue = value.replace(/[^0-9]/g, '').slice(0, 2).replace(/^0+/, '') || '0'; setDuration(prev => ({ ...prev, [id]: sanitizedValue })); };
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); setLoading(true);
        const totalDurationMinutes = (parseInt(duration.hours, 10) || 0) * 60 + (parseInt(duration.minutes, 10) || 0);
        const rekapData = { ...formData, durasi_menit: totalDurationMinutes, waktu_selesai: calculatedEndTime };
        try {
            if (rekap) {
                const { data: updatedRekap, error } = await supabase.from('rekap_live').update(rekapData).eq('id', rekap.id).select().single();
                if (error) throw error;
                setData(prev => ({ ...prev, rekapLive: prev.rekapLive.map(r => r.id === rekap.id ? updatedRekap : r) }));
                showNotification('Rekap berhasil diperbarui.');
            } else {
                const { data: newRekap, error } = await supabase.from('rekap_live').insert(rekapData).select().single();
                if (error) throw error;
                setData(prev => ({ ...prev, rekapLive: [...prev.rekapLive, newRekap] }));
                showNotification('Rekap baru berhasil ditambahkan.');
            }
            onClose();
        } catch (error: any) {
            showNotification(`Gagal menyimpan: ${error.message}`, true);
        } finally { setLoading(false); }
    };

    const commonInputClasses = "bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 dark:bg-stone-700 dark:border-stone-600 dark:placeholder-stone-400 dark:text-white";
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={rekap ? 'Ubah Rekap Live' : 'Tambah Rekap Baru'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div><label htmlFor="host_id" className="block mb-2 text-sm font-medium text-stone-900 dark:text-stone-300">Pilih Host</label><select id="host_id" value={formData.host_id} onChange={handleFormChange} disabled={!isSuperAdmin} required className={commonInputClasses}><option value="">Pilih Host</option>{data.hosts.map(h => <option key={h.id} value={h.id}>{h.nama_host}</option>)}</select></div>
                <div><label htmlFor="tiktok_account_id" className="block mb-2 text-sm font-medium text-stone-900 dark:text-stone-300">Akun TikTok</label><select id="tiktok_account_id" value={formData.tiktok_account_id} onChange={handleFormChange} required className={commonInputClasses}><option value="">Pilih Akun TikTok</option>{data.tiktokAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.username}</option>)}</select></div>
                <div><label htmlFor="tanggal_live" className="block mb-2 text-sm font-medium text-stone-900 dark:text-stone-300">Tanggal Live</label><input id="tanggal_live" type="date" value={formData.tanggal_live} onChange={handleFormChange} required className={commonInputClasses} /></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label htmlFor="waktu_mulai" className="block mb-2 text-sm font-medium text-stone-900 dark:text-stone-300">Waktu Mulai</label><input id="waktu_mulai" type="time" value={formData.waktu_mulai} onChange={handleFormChange} required className={commonInputClasses} /></div>
                    <div><label htmlFor="duration" className="block mb-2 text-sm font-medium text-stone-900 dark:text-stone-300">Durasi</label><div className="flex items-center space-x-2"><input id="hours" type="number" value={duration.hours} onChange={handleDurationChange} className={commonInputClasses} placeholder="Jam" min="0" /><span className="text-stone-500">j</span><input id="minutes" type="number" value={duration.minutes} onChange={handleDurationChange} className={commonInputClasses} placeholder="Menit" min="0" max="59"/><span className="text-stone-500">m</span></div></div>
                </div>
                <div><label className="block mb-2 text-sm font-medium text-stone-900 dark:text-stone-300">Jam Selesai (dihitung otomatis)</label><div className="bg-stone-100 dark:bg-stone-800 p-2.5 rounded-lg text-center font-mono">{calculatedEndTime}</div></div>
                <div><label htmlFor="pendapatan" className="block mb-2 text-sm font-medium text-stone-900 dark:text-stone-300">Pendapatan (Diamond)</label><input id="pendapatan" type="number" value={formData.pendapatan} onChange={handleFormChange} placeholder="Contoh: 5500" required className={commonInputClasses} /></div>
                <div><label htmlFor="catatan" className="block mb-2 text-sm font-medium text-stone-900 dark:text-stone-300">Catatan</label><textarea id="catatan" value={formData.catatan} onChange={handleFormChange} placeholder="Topik live, kendala, dll..." rows={3} className={commonInputClasses}></textarea></div>
                <div className="flex justify-end space-x-4 pt-4"><button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-stone-700 bg-stone-100 rounded-lg hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300 dark:hover:bg-stone-600">Batal</button><button type="submit" disabled={loading} className="unity-gradient-bg font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:opacity-90 flex items-center justify-center disabled:opacity-75">{loading ? 'Menyimpan...' : 'Simpan'}</button></div>
            </form>
        </Modal>
    );
}


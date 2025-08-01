import { useContext, useState, useMemo } from 'react';
import { AppContext, AppContextType, supabase } from '../App';
import { Plus, Check, XCircle, Edit, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';

// Komponen ini adalah halaman Manajemen Rekap Live.
export default function RekapPage() {
    const [month, setMonth] = useState(new Date().getMonth());
    const [year, setYear] = useState(new Date().getFullYear());
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedRekap, setSelectedRekap] = useState<any | null>(null);

    const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

    const handleViewDetail = (rekap: any) => {
        setSelectedRekap(rekap);
        setIsDetailModalOpen(true);
    };

    const handleCloseDetail = () => {
        setIsDetailModalOpen(false);
        setSelectedRekap(null);
    };

    return (
        <section>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100">Manajemen Rekap Live</h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Tambah, lihat, ubah, dan hapus riwayat sesi live.</p>
                </div>
                <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                    <div className="flex items-center space-x-2">
                        <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 dark:bg-stone-700 dark:border-stone-600 dark:placeholder-stone-400 dark:text-white">
                            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                        </select>
                        <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 dark:bg-stone-700 dark:border-stone-600 dark:placeholder-stone-400 dark:text-white">
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <button onClick={() => alert('Fungsi Tambah Rekap akan dibuat selanjutnya.')} className="unity-gradient-bg text-white font-semibold px-4 py-2.5 rounded-lg shadow-sm hover:opacity-90 flex items-center">
                        <Plus className="h-5 w-5 mr-2" />
                        Tambah Rekap
                    </button>
                </div>
            </div>
            <RekapTable month={month} year={year} onViewDetail={handleViewDetail} />
            
            {selectedRekap && (
                <RekapDetailModal 
                    isOpen={isDetailModalOpen}
                    onClose={handleCloseDetail}
                    rekap={selectedRekap}
                />
            )}
        </section>
    );
}

// Komponen Tabel Rekap
function RekapTable({ month, year, onViewDetail }: { month: number, year: number, onViewDetail: (rekap: any) => void }) {
    const { data, session } = useContext(AppContext) as AppContextType;
    const isSuperAdmin = session!.user.user_metadata?.role === 'superadmin';

    const filteredData = useMemo(() => {
        return data.rekapLive.filter(r => {
            const recDate = new Date(r.tanggal_live);
            let match = recDate.getFullYear() === year && recDate.getMonth() === month;
            if (!isSuperAdmin) {
                match = match && r.host_id === session!.user.user_metadata.host_id;
            }
            return match;
        }).sort((a, b) => new Date(b.tanggal_live).getTime() - new Date(a.tanggal_live).getTime());
    }, [data.rekapLive, month, year, isSuperAdmin, session]);

    const formatDuration = (minutes: number) => `${Math.floor(minutes / 60)}j ${minutes % 60}m`;
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' });

    return (
        <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 overflow-x-auto">
            <table className="w-full text-sm text-left text-stone-600 dark:text-stone-300">
                <thead className="hidden md:table-header-group text-xs text-stone-700 dark:text-stone-400 uppercase bg-stone-100 dark:bg-stone-700">
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
                    {filteredData.length > 0 ? filteredData.map(rekap => {
                        const host = data.hosts.find(h => h.id === rekap.host_id);
                        const tiktokAccount = data.tiktokAccounts.find(t => t.id === rekap.tiktok_account_id);
                        return (
                            <tr key={rekap.id} className="block md:table-row bg-white dark:bg-stone-800 border-b dark:border-stone-700 mb-4 md:mb-0">
                                <td data-label="Tanggal:" className="mobile-label px-6 py-4 block md:table-cell">{formatDate(rekap.tanggal_live)}</td>
                                {isSuperAdmin && <td data-label="Host:" className="mobile-label px-6 py-4 block md:table-cell font-medium text-stone-900 dark:text-white">{host?.nama_host || 'N/A'}</td>}
                                <td data-label="Akun:" className="mobile-label px-6 py-4 block md:table-cell">{tiktokAccount?.username || 'N/A'}</td>
                                <td data-label="Durasi:" className="mobile-label px-6 py-4 block md:table-cell">{formatDuration(rekap.durasi_menit)}</td>
                                <td data-label="Diamond:" className="mobile-label px-6 py-4 block md:table-cell">{new Intl.NumberFormat().format(rekap.pendapatan)}</td>
                                <td data-label="Status:" className="mobile-label px-6 py-4 block md:table-cell">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${rekap.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {rekap.status}
                                    </span>
                                </td>
                                <td data-label="Aksi:" className="mobile-label px-6 py-4 block md:table-cell text-right md:text-center">
                                    <button onClick={() => onViewDetail(rekap)} className="font-medium text-purple-600 hover:underline dark:text-purple-500">
                                        Lihat Detail
                                    </button>
                                </td>
                            </tr>
                        );
                    }) : (
                        <tr>
                            <td colSpan={isSuperAdmin ? 7 : 6} className="text-center py-8 text-stone-500 dark:text-stone-400">
                                Tidak ada data rekap untuk ditampilkan pada periode ini.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

// Komponen Modal Detail Rekap
function RekapDetailModal({ isOpen, onClose, rekap }: { isOpen: boolean, onClose: () => void, rekap: any }) {
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
            
            setData(prevData => ({
                ...prevData,
                rekapLive: prevData.rekapLive.map(r => 
                    r.id === rekap.id ? { ...r, status: newStatus } : r
                )
            }));

            showNotification(`Status rekap berhasil diubah ke ${newStatus}.`);
            onClose();
        } catch (error: any) {
            showNotification(`Gagal mengubah status: ${error.message}`, true);
        }
    };

    const handleDelete = async () => {
        if(window.confirm("Apakah Anda yakin ingin menghapus rekap ini?")) {
            try {
                const { error } = await supabase.from('rekap_live').delete().eq('id', rekap.id);
                if (error) throw error;

                setData(prevData => ({
                    ...prevData,
                    rekapLive: prevData.rekapLive.filter(r => r.id !== rekap.id)
                }));

                showNotification('Rekap berhasil dihapus.');
                onClose();
            } catch (error: any) {
                showNotification(`Gagal menghapus rekap: ${error.message}`, true);
            }
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Detail Rekap Live">
            <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b pb-2 dark:border-stone-600">
                    <span className="font-medium text-stone-500 dark:text-stone-400">Tanggal Live:</span> 
                    <span className="text-stone-900 dark:text-white font-semibold">{formatDate(rekap.tanggal_live)}</span>
                </div>
                <div className="flex justify-between border-b pb-2 dark:border-stone-600">
                    <span className="font-medium text-stone-500 dark:text-stone-400">Host:</span> 
                    <span className="text-stone-900 dark:text-white font-semibold">{host?.nama_host || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b pb-2 dark:border-stone-600">
                    <span className="font-medium text-stone-500 dark:text-stone-400">Akun TikTok:</span> 
                    <span className="text-stone-900 dark:text-white font-semibold">{tiktokAccount?.username || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b pb-2 dark:border-stone-600">
                    <span className="font-medium text-stone-500 dark:text-stone-400">Waktu:</span> 
                    <span className="text-stone-900 dark:text-white font-semibold">{rekap.waktu_mulai} - {rekap.waktu_selesai}</span>
                </div>
                <div className="flex justify-between border-b pb-2 dark:border-stone-600">
                    <span className="font-medium text-stone-500 dark:text-stone-400">Durasi:</span> 
                    <span className="text-stone-900 dark:text-white font-semibold">{formatDuration(rekap.durasi_menit)}</span>
                </div>
                <div className="flex justify-between border-b pb-2 dark:border-stone-600">
                    <span className="font-medium text-stone-500 dark:text-stone-400">Pendapatan:</span> 
                    <span className="text-stone-900 dark:text-white font-semibold">{formatDiamond(rekap.pendapatan)} 💎</span>
                </div>
                <div className="mt-4">
                    <p className="font-medium text-stone-500 dark:text-stone-400 mb-1">Catatan:</p>
                    <p className="text-stone-800 dark:text-stone-200 bg-stone-100 dark:bg-stone-700 p-3 rounded-md min-h-[50px]">{rekap.catatan || 'Tidak ada catatan.'}</p>
                </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4 mt-4 border-t dark:border-stone-600">
                {isSuperAdmin && rekap.status === 'pending' && (
                    <>
                        <button onClick={() => handleStatusChange('approved')} className="text-sm font-medium text-green-600 hover:underline flex items-center"><Check className="h-4 w-4 mr-1"/>Approve</button>
                        <button onClick={() => handleStatusChange('rejected')} className="text-sm font-medium text-red-600 hover:underline flex items-center"><XCircle className="h-4 w-4 mr-1"/>Reject</button>
                    </>
                )}
                {isSuperAdmin && rekap.status === 'approved' && (
                    <button onClick={() => handleStatusChange('pending')} className="text-sm font-medium text-yellow-600 hover:underline">Rollback</button>
                )}
                {rekap.status === 'pending' && (
                    <>
                        <button onClick={() => alert("Fungsi ubah akan dibuat")} className="text-sm font-medium text-purple-600 hover:underline flex items-center"><Edit className="h-4 w-4 mr-1"/>Ubah</button>
                        <button onClick={handleDelete} className="text-sm font-medium text-red-600 hover:underline flex items-center"><Trash2 className="h-4 w-4 mr-1"/>Hapus</button>
                    </>
                )}
            </div>
        </Modal>
    );
}

import React, { useState, useEffect, useCallback, useContext } from 'react';
import { AppContext, AppContextType, supabase } from '../App';
import { Download, Trash2, Eye, Check, XCircle, Target } from 'lucide-react';
import Modal from './Modal';

interface ProfileEditorProps {
    hostId: number;
}

const documentCategories = {
    'ID': { label: 'Identitas Diri', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
    'KONTRAK': { label: 'Kontrak', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
    'PAJAK': { label: 'Pajak', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    'LAINNYA': { label: 'Lainnya', color: 'bg-stone-100 text-stone-800 dark:bg-stone-700 dark:text-stone-300' },
};

const documentStatuses = {
    'pending': { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
    'approved': { label: 'Approved', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    'rejected': { label: 'Rejected', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
};

// Komponen ini menampilkan formulir profil dan manajemen dokumen untuk host tertentu.
export default function ProfileEditor({ hostId }: { hostId: number }) {
    const { data, showNotification } = useContext(AppContext) as AppContextType;
    const [loading, setLoading] = useState(false);
    const hostData = data.hosts.find(h => h.id === hostId);

    const [formData, setFormData] = useState({
        nama_host: '',
        nomor_telepon: '',
        alamat: '',
        nama_bank: '',
        nomor_rekening: '',
    });

    useEffect(() => {
        if (hostData) {
            setFormData({
                nama_host: hostData.nama_host || '',
                nomor_telepon: hostData.nomor_telepon || '',
                alamat: hostData.alamat || '',
                nama_bank: hostData.nama_bank || '',
                nomor_rekening: hostData.nomor_rekening || '',
            });
        }
    }, [hostData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.from('hosts').update(formData).eq('id', hostId);
            if (error) throw error;
            showNotification('Profil berhasil diperbarui!');
            // Tidak perlu fetchData() karena data akan diperbarui oleh subscription
        } catch (error: any) {
            showNotification(`Gagal memperbarui profil: ${error.message}`, true);
        } finally {
            setLoading(false);
        }
    };
    
    const commonInputClasses = "bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 dark:bg-stone-700 dark:border-stone-600 dark:placeholder-stone-400 dark:text-white";

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-stone-800 p-6 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700">
                <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
                    {/* ... (Form profil yang sudah ada tidak berubah) ... */}
                    <div>
                        <label htmlFor="nama_host" className="block mb-2 text-sm font-medium text-stone-900 dark:text-stone-300">Nama Lengkap</label>
                        <input type="text" id="nama_host" value={formData.nama_host} onChange={handleInputChange} className={commonInputClasses} required />
                    </div>
                    <div>
                        <label htmlFor="nomor_telepon" className="block mb-2 text-sm font-medium text-stone-900 dark:text-stone-300">Nomor Telepon</label>
                        <input type="tel" id="nomor_telepon" value={formData.nomor_telepon} onChange={handleInputChange} className={commonInputClasses} placeholder="08..." />
                    </div>
                    <div>
                        <label htmlFor="alamat" className="block mb-2 text-sm font-medium text-stone-900 dark:text-stone-300">Alamat</label>
                        <textarea id="alamat" value={formData.alamat} onChange={handleInputChange} rows={3} className={commonInputClasses} placeholder="Alamat lengkap..."></textarea>
                    </div>
                    <div className="border-t border-stone-200 dark:border-stone-700 pt-6">
                         <h3 className="text-lg font-medium text-stone-900 dark:text-stone-200">Informasi Bank</h3>
                    </div>
                    <div>
                        <label htmlFor="nama_bank" className="block mb-2 text-sm font-medium text-stone-900 dark:text-stone-300">Nama Bank</label>
                        <input type="text" id="nama_bank" value={formData.nama_bank} onChange={handleInputChange} className={commonInputClasses} placeholder="Contoh: BCA, Mandiri" />
                    </div>
                    <div>
                        <label htmlFor="nomor_rekening" className="block mb-2 text-sm font-medium text-stone-900 dark:text-stone-300">Nomor Rekening</label>
                        <input type="text" id="nomor_rekening" value={formData.nomor_rekening} onChange={handleInputChange} className={commonInputClasses} placeholder="Masukkan nomor rekening" />
                    </div>
                    <div className="flex justify-end pt-2">
                         <button type="submit" disabled={loading} className="unity-gradient-bg text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:opacity-90 flex items-center justify-center disabled:opacity-75">
                            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </div>
            {/* --- PENAMBAHAN: Bagian untuk mengatur target --- */}
            <TargetSetter hostId={hostId} />
            <DocumentSection hostId={hostId} />
        </div>
    );
}

// --- PENAMBAHAN: Komponen baru untuk mengatur target ---
function TargetSetter({ hostId }: { hostId: number }) {
    const { data, setData, showNotification } = useContext(AppContext) as AppContextType;
    const hostData = data.hosts.find(h => h.id === hostId);
    const [target, setTarget] = useState(hostData?.monthly_diamond_target || 0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setTarget(hostData?.monthly_diamond_target || 0);
    }, [hostData]);

    const handleTargetSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data: updatedHost, error } = await supabase
                .from('hosts')
                .update({ monthly_diamond_target: target })
                .eq('id', hostId)
                .select()
                .single();

            if (error) throw error;

            setData(prev => ({
                ...prev,
                hosts: prev.hosts.map(h => h.id === hostId ? updatedHost : h)
            }));
            showNotification('Target bulanan berhasil diperbarui!');
        } catch (error: any) {
            showNotification(`Gagal menyimpan target: ${error.message}`, true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-stone-800 p-6 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700">
            <h3 className="text-lg font-medium text-stone-900 dark:text-stone-200 flex items-center">
                <Target className="h-5 w-5 mr-3 text-purple-500" />
                Target Diamond Bulanan
            </h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Atur target pribadi untuk memotivasi diri Anda setiap bulan.</p>
            <form onSubmit={handleTargetSubmit} className="mt-4 flex flex-col sm:flex-row items-end gap-4">
                <div className="w-full">
                    <label htmlFor="monthly_diamond_target" className="block mb-2 text-sm font-medium text-stone-900 dark:text-stone-300">Target Diamond</label>
                    <input 
                        type="number" 
                        id="monthly_diamond_target" 
                        value={target}
                        onChange={(e) => setTarget(parseInt(e.target.value) || 0)}
                        className="bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 dark:bg-stone-700 dark:border-stone-600 dark:placeholder-stone-400 dark:text-white"
                        placeholder="Contoh: 100000"
                    />
                </div>
                <button type="submit" disabled={loading} className="w-full sm:w-auto unity-gradient-bg text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:opacity-90 flex items-center justify-center disabled:opacity-75">
                    {loading ? 'Menyimpan...' : 'Simpan Target'}
                </button>
            </form>
        </div>
    );
}

// Komponen untuk Manajemen Dokumen
function DocumentSection({ hostId }: { hostId: number }) {
    const { session, showNotification } = useContext(AppContext) as AppContextType;
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(Object.keys(documentCategories)[0]);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [fileToPreview, setFileToPreview] = useState<any | null>(null);
    const isSuperAdmin = session!.user.user_metadata?.role === 'superadmin';

    const fetchDocuments = useCallback(async () => {
        if (!hostId) return;
        const { data, error } = await supabase.storage.from('host-document').list(hostId.toString());
        if (error) {
            console.error('Error fetching documents:', error);
        } else {
            setDocuments(data);
        }
    }, [hostId]);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !hostId) return;
        
        setLoading(true);
        // Ganti spasi dengan garis bawah untuk nama file yang aman
        const sanitizedFileName = file.name.replace(/\s+/g, '_');
        const filePath = `${hostId}/${selectedCategory}_pending_${sanitizedFileName}`;
        
        try {
            const { error } = await supabase.storage
                .from('host-document')
                .upload(filePath, file, { upsert: true });
            if (error) throw error;
            showNotification('Dokumen berhasil diunggah dan menunggu persetujuan.');
            fetchDocuments();
        } catch (error: any) {
            showNotification(`Gagal mengunggah: ${error.message}`, true);
        } finally {
            setLoading(false);
        }
    };
    
    const handleStatusUpdate = async (fileName: string, newStatus: 'approved' | 'rejected') => {
        const { category, status, name } = parseFileName(fileName);
        if (!category || !status || !name) return;

        const oldPath = `${hostId}/${fileName}`;
        const newPath = `${hostId}/${category.key}_${newStatus}_${name}`;

        try {
            const { error } = await supabase.storage.from('host-document').move(oldPath, newPath);
            if (error) throw error;
            showNotification(`Status dokumen berhasil diubah ke ${newStatus}.`);
            fetchDocuments();
        } catch (error: any) {
            showNotification(`Gagal memperbarui status: ${error.message}`, true);
        }
    };

    const handleDelete = async (fileName: string) => {
        if (window.confirm(`Apakah Anda yakin ingin menghapus file "${fileName}"?`)) {
            try {
                const { error } = await supabase.storage.from('host-document').remove([`${hostId}/${fileName}`]);
                if (error) throw error;
                showNotification('Dokumen berhasil dihapus.');
                fetchDocuments();
            } catch (error: any) {
                showNotification(`Gagal menghapus file: ${error.message}`, true);
            }
        }
    };

    const handlePreview = (doc: any) => {
        setFileToPreview(doc);
        setIsPreviewOpen(true);
    };
    
    const parseFileName = (fileName: string) => {
        const parts = fileName.split('_');
        if (parts.length >= 3) {
            const categoryKey = parts[0];
            const statusKey = parts[1];
            const originalName = parts.slice(2).join('_');

            if (documentCategories[categoryKey as keyof typeof documentCategories] && documentStatuses[statusKey as keyof typeof documentStatuses]) {
                return {
                    name: originalName,
                    category: { key: categoryKey, ...documentCategories[categoryKey as keyof typeof documentCategories] },
                    status: { key: statusKey, ...documentStatuses[statusKey as keyof typeof documentStatuses] },
                };
            }
        }
        return { name: fileName, category: { key: 'LAINNYA', ...documentCategories['LAINNYA'] }, status: null };
    };

    return (
        <>
            <div className="mt-8 bg-white dark:bg-stone-800 p-6 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 max-w-lg">
                <h3 className="text-lg font-medium text-stone-900 dark:text-stone-200">Manajemen Dokumen</h3>
                <div className="mt-4 space-y-2">
                    {documents.map(doc => {
                        const { name, category, status } = parseFileName(doc.name);
                        return (
                            <div key={doc.id} className="flex justify-between items-center bg-stone-100 dark:bg-stone-700 p-2 rounded-md">
                                <div className="flex items-center overflow-hidden">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-md mr-3 ${category.color}`}>{category.label}</span>
                                    {status && <span className={`px-2 py-1 text-xs font-semibold rounded-md mr-3 ${status.color}`}>{status.label}</span>}
                                    <span className="text-sm truncate">{name}</span>
                                </div>
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                    {isSuperAdmin && status?.key === 'pending' && (
                                        <>
                                            <button onClick={() => handleStatusUpdate(doc.name, 'approved')} title="Setujui" className="p-1 text-green-600 hover:text-green-800"><Check className="h-4 w-4" /></button>
                                            <button onClick={() => handleStatusUpdate(doc.name, 'rejected')} title="Tolak" className="p-1 text-red-600 hover:text-red-800"><XCircle className="h-4 w-4" /></button>
                                        </>
                                    )}
                                    <button onClick={() => handlePreview(doc)} title="Lihat" className="p-1 text-blue-600 hover:text-blue-800"><Eye className="h-4 w-4" /></button>
                                    <button onClick={() => handleDelete(doc.name)} title="Hapus" className="p-1 text-red-600 hover:text-red-800"><Trash2 className="h-4 w-4" /></button>
                                </div>
                            </div>
                        )
                    })}
                </div>
                <div className="mt-4">
                    <label htmlFor="host-document-file" className="block mb-2 text-sm font-medium">Unggah Dokumen Baru</label>
                    <div className="flex items-center space-x-2">
                        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2.5 dark:bg-stone-700 dark:border-stone-600">
                            {Object.entries(documentCategories).map(([key, {label}]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                        <input type="file" id="host-document-file" onChange={handleUpload} disabled={loading} className="block w-full text-sm text-stone-900 border border-stone-300 rounded-lg cursor-pointer bg-stone-50 focus:outline-none dark:bg-stone-700 dark:border-stone-600" />
                    </div>
                    {loading && <p className="text-sm text-purple-600 mt-2">Mengunggah...</p>}
                </div>
            </div>
            {isPreviewOpen && fileToPreview && (
                <DocumentPreviewModal 
                    isOpen={isPreviewOpen}
                    onClose={() => setIsPreviewOpen(false)}
                    file={fileToPreview}
                    hostId={hostId}
                />
            )}
        </>
    );
}

// Komponen Modal Pratinjau Dokumen
function DocumentPreviewModal({ isOpen, onClose, file, hostId }: { isOpen: boolean, onClose: () => void, file: any, hostId: number }) {
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useContext(AppContext) as AppContextType;

    useEffect(() => {
        const getFileUrl = async () => {
            setLoading(true);
            const { data, error } = await supabase.storage
                .from('host-document')
                .createSignedUrl(`${hostId}/${file.name}`, 60); // URL berlaku selama 60 detik

            if (error) {
                console.error("Error creating signed URL:", error);
                showNotification("Gagal memuat pratinjau.", true);
            } else {
                setFileUrl(data.signedUrl);
            }
            setLoading(false);
        };
        if (isOpen) {
            getFileUrl();
        }
    }, [isOpen, file, hostId, showNotification]);

    const isImage = file.metadata.mimetype.startsWith('image/');

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Pratinjau Dokumen">
            {loading && <p>Memuat pratinjau...</p>}
            {!loading && fileUrl && (
                isImage ? (
                    <img src={fileUrl} alt={`Pratinjau ${file.name}`} className="max-w-full h-auto rounded-md" />
                ) : (
                    <div>
                        <p className="text-sm text-stone-600 dark:text-stone-300">Pratinjau tidak tersedia untuk tipe file ini.</p>
                        <a href={fileUrl} download target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center unity-gradient-bg text-white font-semibold px-4 py-2 rounded-lg shadow-sm hover:opacity-90">
                            <Download className="h-4 w-4 mr-2" />
                            Unduh Dokumen
                        </a>
                    </div>
                )
            )}
        </Modal>
    );
}

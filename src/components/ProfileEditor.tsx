import React, { useState, useEffect, useCallback, useContext } from 'react';
import { AppContext, AppContextType, supabase } from '../App';
import { Download, Trash2 } from 'lucide-react';

interface ProfileEditorProps {
    hostId: number;
}

const documentCategories = {
    'ID': { label: 'Identitas Diri', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
    'KONTRAK': { label: 'Kontrak', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
    'PAJAK': { label: 'Pajak', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    'LAINNYA': { label: 'Lainnya', color: 'bg-stone-100 text-stone-800 dark:bg-stone-700 dark:text-stone-300' },
};

// Komponen ini menampilkan formulir profil dan manajemen dokumen untuk host tertentu.
export default function ProfileEditor({ hostId }: ProfileEditorProps) {
    const { data, fetchData, showNotification } = useContext(AppContext) as AppContextType;
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
            fetchData();
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
            <DocumentSection hostId={hostId} />
        </div>
    );
}

// Komponen untuk Manajemen Dokumen
function DocumentSection({ hostId }: { hostId: number }) {
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(Object.keys(documentCategories)[0]);
    const { showNotification } = useContext(AppContext) as AppContextType;

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
        const filePath = `${hostId}/[${selectedCategory}]${file.name}`;
        try {
            const { error } = await supabase.storage
                .from('host-document')
                .upload(filePath, file, { upsert: true });
            if (error) throw error;
            showNotification('Dokumen berhasil diunggah.');
            fetchDocuments();
        } catch (error: any) {
            showNotification(`Gagal mengunggah: ${error.message}`, true);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (fileName: string) => {
        try {
            const { data, error } = await supabase.storage.from('host-document').download(`${hostId}/${fileName}`);
            if (error) throw error;
            const blob = new Blob([data], { type: data.type });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName.replace(/^\[.*?\]/, ''); // Hapus tag kategori saat mengunduh
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error: any) {
            showNotification(`Gagal mengunduh file: ${error.message}`, true);
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
    
    const parseFileName = (name: string) => {
        const match = name.match(/^\[(.*?)\](.*)/);
        if (match) {
            const categoryKey = match[1];
            const originalName = match[2];
            const categoryInfo = documentCategories[categoryKey as keyof typeof documentCategories] || documentCategories['LAINNYA'];
            return { name: originalName, category: categoryInfo };
        }
        return { name, category: documentCategories['LAINNYA'] };
    };

    return (
        <div className="mt-8 bg-white dark:bg-stone-800 p-6 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 max-w-lg">
            <h3 className="text-lg font-medium text-stone-900 dark:text-stone-200">Manajemen Dokumen</h3>
            <div className="mt-4 space-y-2">
                {documents.length > 0 ? documents.map(doc => {
                    const { name, category } = parseFileName(doc.name);
                    return (
                        <div key={doc.id} className="flex justify-between items-center bg-stone-100 dark:bg-stone-700 p-2 rounded-md">
                            <div className="flex items-center overflow-hidden">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-md mr-3 ${category.color}`}>{category.label}</span>
                                <span className="text-sm truncate">{name}</span>
                            </div>
                            <div className="flex space-x-2 flex-shrink-0">
                                <button onClick={() => handleDownload(doc.name)} title="Unduh" className="p-1 text-purple-600 hover:text-purple-800"><Download className="h-4 w-4" /></button>
                                <button onClick={() => handleDelete(doc.name)} title="Hapus" className="p-1 text-red-600 hover:text-red-800"><Trash2 className="h-4 w-4" /></button>
                            </div>
                        </div>
                    )
                }) : <p className="text-sm text-stone-500">Belum ada dokumen.</p>}
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
    );
}

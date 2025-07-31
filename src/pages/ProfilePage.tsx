import React, { useContext, useState, useEffect } from 'react';
import { AppContext, AppContextType, supabase } from '../App';
import { Download, Trash2 } from 'lucide-react';

// Komponen ini adalah halaman Profil Saya untuk host.
export default function ProfilePage() {
    const { data, session, fetchData } = useContext(AppContext) as AppContextType;
    const [loading, setLoading] = useState(false);

    // Menemukan data host yang sedang login
    const hostData = data.hosts.find(h => h.id === session!.user.user_metadata.host_id);

    const [formData, setFormData] = useState({
        nama_host: '',
        nomor_telepon: '',
        alamat: '',
        nama_bank: '',
        nomor_rekening: '',
    });

    // Mengisi form dengan data host saat komponen dimuat
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
            const { error } = await supabase
                .from('hosts')
                .update(formData)
                .eq('id', session!.user.user_metadata.host_id);
            if (error) throw error;
            alert('Profil berhasil diperbarui!');
            fetchData(); // Muat ulang data untuk menampilkan perubahan
        } catch (error: any) {
            alert(`Gagal memperbarui profil: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="space-y-8">
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100">Profil Saya</h2>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Perbarui data pribadi dan informasi bank Anda.</p>
            </div>
            <div className="bg-white dark:bg-stone-800 p-6 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700">
                <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
                    {/* ... (Isi formulir seperti di bawah) ... */}
                    <div className="flex justify-end pt-2">
                         <button type="submit" disabled={loading} className="unity-gradient-bg text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:opacity-90 flex items-center justify-center disabled:opacity-75">
                            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </div>
            <DocumentSection />
        </section>
    );
}

// Komponen untuk Manajemen Dokumen
function DocumentSection() {
    const { session, fetchData } = useContext(AppContext) as AppContextType;
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const hostId = session!.user.user_metadata.host_id;

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
        const filePath = `${hostId}/${file.name}`;
        try {
            const { error } = await supabase.storage
                .from('host-document')
                .upload(filePath, file, { upsert: true });
            if (error) throw error;
            alert('Dokumen berhasil diunggah.');
            fetchDocuments(); // Refresh daftar dokumen
        } catch (error: any) {
            alert(`Gagal mengunggah: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-8 bg-white dark:bg-stone-800 p-6 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 max-w-lg">
            <h3 className="text-lg font-medium text-stone-900 dark:text-stone-200">Manajemen Dokumen</h3>
            <div className="mt-4 space-y-2">
                {documents.length > 0 ? documents.map(doc => (
                    <div key={doc.id} className="flex justify-between items-center bg-stone-100 dark:bg-stone-700 p-2 rounded-md">
                        <span className="text-sm">{doc.name}</span>
                        {/* Tombol Unduh & Hapus akan ditambahkan di sini */}
                    </div>
                )) : <p className="text-sm text-stone-500">Belum ada dokumen.</p>}
            </div>
            <div className="mt-4">
                <label htmlFor="host-document-file" className="block mb-2 text-sm font-medium">Unggah Dokumen Baru</label>
                <input type="file" id="host-document-file" onChange={handleUpload} disabled={loading} className="block w-full text-sm text-stone-900 border border-stone-300 rounded-lg cursor-pointer bg-stone-50 focus:outline-none dark:bg-stone-700 dark:border-stone-600" />
                {loading && <p className="text-sm text-purple-600 mt-2">Mengunggah...</p>}
            </div>
        </div>
    );
}

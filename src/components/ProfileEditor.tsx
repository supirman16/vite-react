import React, { useState, useEffect, useCallback, useContext } from 'react';
import { AppContext, AppContextType, supabase } from '../App';
import { Download, Trash2 } from 'lucide-react';

interface ProfileEditorProps {
    hostId: number;
}

// Komponen ini menampilkan formulir profil dan manajemen dokumen untuk host tertentu.
// Bisa digunakan oleh host sendiri atau oleh superadmin.
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

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-stone-800 p-6 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700">
                <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
                    {/* ... (Isi formulir seperti di ProfilePage.tsx sebelumnya) ... */}
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
        // ... (Logika upload tetap sama) ...
    };

    const handleDownload = async (fileName: string) => {
        // ... (Logika download tetap sama) ...
    };

    const handleDelete = async (fileName: string) => {
        // ... (Logika delete tetap sama) ...
    };

    return (
        <div className="mt-8 bg-white dark:bg-stone-800 p-6 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 max-w-lg">
            <h3 className="text-lg font-medium text-stone-900 dark:text-stone-200">Manajemen Dokumen</h3>
            {/* ... (Isi bagian dokumen seperti di ProfilePage.tsx sebelumnya) ... */}
        </div>
    );
}

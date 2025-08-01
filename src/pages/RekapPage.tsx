// ... (impor lain tetap sama) ...
import Modal from '../components/Modal';

// ... (Komponen RekapPage dan RekapTable tetap sama) ...

// Komponen Modal Detail Rekap
function RekapDetailModal({ isOpen, onClose, rekap }: { isOpen: boolean, onClose: () => void, rekap: any }) {
    const { data, session, fetchData, showNotification } = useContext(AppContext) as AppContextType;
    const isSuperAdmin = session!.user.user_metadata?.role === 'superadmin';
    
    // ... (logika lain tetap sama) ...

    const handleStatusChange = async (newStatus: string) => {
        try {
            const { error } = await supabase.from('rekap_live').update({ status: newStatus }).eq('id', rekap.id);
            if (error) throw error;
            showNotification(`Status rekap berhasil diubah ke ${newStatus}.`);
            fetchData();
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
                showNotification('Rekap berhasil dihapus.');
                fetchData();
                onClose();
            } catch (error: any) {
                showNotification(`Gagal menghapus rekap: ${error.message}`, true);
            }
        }
    };

    // ... (return statement tetap sama) ...
}

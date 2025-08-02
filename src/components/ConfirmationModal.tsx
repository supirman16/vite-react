import { useState } from 'react';
import Modal from './Modal';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    title: string;
    message: string;
    confirmText?: string;
    loadingText?: string;
}

// Komponen ini bertanggung jawab untuk menampilkan dialog konfirmasi
// sebelum melakukan tindakan yang berpotensi merusak (seperti menghapus data).
export default function ConfirmationModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message,
    confirmText = "Ya, Hapus",
    loadingText = "Menghapus..."
}: ConfirmationModalProps) {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        await onConfirm();
        // Tidak perlu setLoading(false) karena komponen akan ditutup oleh induknya
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <p className="text-sm text-stone-600 dark:text-stone-300 mt-2 mb-6">{message}</p>
            <div className="flex justify-end space-x-4">
                <button 
                    onClick={onClose} 
                    className="px-5 py-2.5 text-sm font-medium text-stone-700 bg-stone-100 rounded-lg hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300 dark:hover:bg-stone-600"
                >
                    Batal
                </button>
                <button 
                    onClick={handleConfirm} 
                    disabled={loading} 
                    className="bg-red-600 text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:bg-red-700 flex items-center justify-center disabled:opacity-75"
                >
                    {loading ? loadingText : confirmText}
                </button>
            </div>
        </Modal>
    );
}

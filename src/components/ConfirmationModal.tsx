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

export default function ConfirmationModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message,
    confirmText = "Ya, Lanjutkan",
    loadingText = "Memproses..."
}: ConfirmationModalProps) {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        await onConfirm();
        // Komponen akan ditutup oleh induknya, jadi tidak perlu setLoading(false)
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <p className="text-sm text-stone-600 dark:text-stone-300 mt-2 mb-6">{message}</p>
            <div className="flex justify-end space-x-4">
                <button 
                    onClick={onClose} 
                    className="px-5 py-2.5 text-sm font-semibold text-stone-700 bg-stone-200 rounded-lg hover:bg-stone-300 dark:bg-stone-700 dark:text-stone-300 dark:hover:bg-stone-600 transition-colors"
                >
                    Batal
                </button>
                <button 
                    onClick={handleConfirm} 
                    disabled={loading} 
                    className="bg-red-600 text-white font-semibold px-5 py-2.5 rounded-lg shadow-lg shadow-red-500/30 hover:bg-red-700 flex items-center justify-center disabled:opacity-75 transition-all hover:shadow-red-500/50"
                >
                    {loading ? loadingText : confirmText}
                </button>
            </div>
        </Modal>
    );
}

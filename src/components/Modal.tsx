import React from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';

// Komponen Modal generik yang bisa digunakan di seluruh aplikasi.
// Ia menggunakan React Portal untuk merender di luar komponen induk,
// dan menggunakan Flexbox untuk memastikan pemusatan yang sempurna.
export default function Modal({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
    if (!isOpen) return null;

    return ReactDOM.createPortal(
        // Wadah utama ini mengambil seluruh layar dan memusatkan isinya.
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
        >
            {/* Latar belakang gelap dengan animasi fade-in */}
            <div 
                className="fixed inset-0 bg-black/60 animate-fade-in-fast"
                onClick={onClose}
                aria-hidden="true"
            ></div>
            
            {/* Panel Modal dengan animasinya sendiri */}
            <div className="relative bg-white dark:bg-stone-800 rounded-xl shadow-lg w-full max-w-lg animate-fade-in overflow-hidden">
                {/* Header Modal */}
                <div className="flex justify-between items-center p-4 border-b dark:border-stone-700">
                    <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100">{title}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                {/* Isi Modal */}
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>,
        document.getElementById('modal-root')!
    );
}

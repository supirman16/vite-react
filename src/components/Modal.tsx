import React from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';

// Komponen Modal generik yang bisa digunakan di seluruh aplikasi.
// Ia menggunakan React Portal untuk merender di luar komponen induk.
export default function Modal({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <>
            <div 
                className="fixed inset-0 bg-black/50 z-40"
                onClick={onClose}
            ></div>
            <div className="modal bg-white dark:bg-stone-800 rounded-xl shadow-lg w-11/12 md:w-1/2 lg:w-1/3 p-6 z-50">
                <div className="flex justify-between items-center mb-4 border-b pb-3 dark:border-stone-600">
                    <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100">{title}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                {children}
            </div>
        </>,
        document.getElementById('modal-root')!
    );
}

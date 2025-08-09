import React from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Modal({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <AnimatePresence>
            {isOpen && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                >
                    <motion.div 
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        aria-hidden="true"
                    ></motion.div>
                    
                    <motion.div 
                        // --- PERBAIKAN DI SINI: Menambahkan kelas latar belakang dan animasi baru ---
                        className="relative flex flex-col bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl rounded-xl w-full max-w-lg border animate-pulse-glow gaming-modal-bg animate-background-pan"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                        {/* Header Modal (Tidak bisa di-scroll) */}
                        <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-stone-200 dark:border-stone-700">
                            <h2 className="text-xl font-bold unity-gradient-text">{title}</h2>
                            <button onClick={onClose} className="p-1 rounded-full text-stone-500 hover:bg-stone-200 dark:text-stone-400 dark:hover:bg-stone-700 transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        
                        {/* Konten Modal (Bisa di-scroll) */}
                        <div className="p-6 overflow-y-auto max-h-[80vh]">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.getElementById('modal-root')!
    );
}

import React, { useState, useEffect, useRef } from 'react';
import { MoreVertical } from 'lucide-react';

interface Action {
    label: string;
    icon: React.ElementType;
    onClick: () => void;
    className?: string;
}

interface DropdownMenuProps {
    actions: Action[];
}

// Komponen ini bertanggung jawab untuk menampilkan menu aksi "tiga titik"
// yang bisa digunakan kembali di dalam tabel.
export default function DropdownMenu({ actions }: DropdownMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Menutup dropdown saat pengguna mengklik di luar area menu
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const handleActionClick = (onClick: () => void) => {
        onClick();
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block text-left" ref={wrapperRef}>
            <div>
                <button 
                    type="button" 
                    className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-700"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <MoreVertical className="h-5 w-5" />
                </button>
            </div>

            {isOpen && (
                <div 
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-stone-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-10 animate-fade-in"
                >
                    <div className="py-1">
                        {actions.map((action) => (
                            <a
                                key={action.label}
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleActionClick(action.onClick);
                                }}
                                className={`flex items-center px-4 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 ${action.className}`}
                            >
                                <action.icon className="mr-3 h-5 w-5" aria-hidden="true" />
                                <span>{action.label}</span>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

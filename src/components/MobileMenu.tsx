import { useContext, useState } from 'react';
import { AppContext, AppContextType } from '../App';
import { LayoutDashboard, Star, FileText, User, DollarSign, Settings, Users, TestTube2, Ticket, MoreHorizontal, X, BarChart3 } from 'lucide-react';
import Modal from './Modal';

// Komponen ini adalah menu navigasi bawah untuk tampilan mobile.
export default function MobileMenu() {
    const context = useContext(AppContext);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    
    // Penjaga untuk mencegah crash saat sesi belum siap
    if (!context || !context.session) {
        return null;
    }

    const { page, setPage, session } = context as AppContextType;

    // --- PERBAIKAN: Logika peran yang disederhanakan dan diperbaiki ---
    const userRole = session.user.user_metadata?.role;

    const hostNavItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'leaderboard', label: 'Peringkat', icon: Star },
        { id: 'rekap', label: 'Rekap', icon: FileText },
        { id: 'salary', label: 'Gaji', icon: DollarSign },
        { id: 'profile', label: 'Profil', icon: User },
        { id: 'settings', label: 'Pengaturan', icon: Settings },
    ];

    const superAdminNavItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'hosts', label: 'Host', icon: Users },
        { id: 'rekap', label: 'Rekap', icon: FileText },
        { id: 'payroll', label: 'Gaji', icon: DollarSign },
        { id: 'leaderboard', label: 'Peringkat', icon: Star },
        { id: 'analysis', label: 'Analisis', icon: BarChart3 },
        { id: 'users', label: 'Pengguna', icon: Users },
        { id: 'tiktok', label: 'Akun', icon: Ticket },
        { id: 'livetest', label: 'Uji Live', icon: TestTube2 },
        { id: 'settings', label: 'Pengaturan', icon: Settings },
    ];

    const allItems = userRole === 'superadmin' ? superAdminNavItems : hostNavItems;
    
    // Tentukan item mana yang akan ditampilkan di bar utama
    const mainItems = allItems.slice(0, 3);
    const moreItems = allItems.slice(3);

    const handleMenuClick = (pageId: string) => {
        setPage(pageId);
        setIsMoreMenuOpen(false);
    };

    return (
        <>
            <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-stone-200 dark:bg-stone-800 dark:border-stone-700 md:hidden">
                <div className="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
                    {mainItems.map(item => (
                        <button key={item.id} type="button" onClick={() => handleMenuClick(item.id)} className={`inline-flex flex-col items-center justify-center px-5 hover:bg-stone-50 dark:hover:bg-stone-900 group ${page === item.id ? 'text-purple-600 dark:text-purple-400' : 'text-stone-500 dark:text-stone-400'}`}>
                            <item.icon className="w-6 h-6 mb-1" />
                            <span className="text-xs">{item.label}</span>
                        </button>
                    ))}
                    <button type="button" onClick={() => setIsMoreMenuOpen(true)} className="inline-flex flex-col items-center justify-center px-5 hover:bg-stone-50 dark:hover:bg-stone-900 group text-stone-500 dark:text-stone-400">
                        <MoreHorizontal className="w-6 h-6 mb-1" />
                        <span className="text-xs">Lainnya</span>
                    </button>
                </div>
            </div>

            {isMoreMenuOpen && (
                <div className="fixed inset-0 z-[100] flex items-end bg-black/60 md:hidden" onClick={() => setIsMoreMenuOpen(false)}>
                    <div className="w-full bg-white dark:bg-stone-800 rounded-t-2xl p-4 animate-slide-up-fast" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Menu Lainnya</h3>
                            <button onClick={() => setIsMoreMenuOpen(false)} className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-700">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            {moreItems.map(item => (
                                <div key={item.id} onClick={() => handleMenuClick(item.id)} className="flex flex-col items-center p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 cursor-pointer">
                                    <div className={`p-3 rounded-full mb-2 ${page === item.id ? 'bg-purple-100 dark:bg-purple-900/50' : 'bg-stone-100 dark:bg-stone-700'}`}>
                                        <item.icon className={`h-6 w-6 ${page === item.id ? 'text-purple-600 dark:text-purple-400' : 'text-stone-600 dark:text-stone-300'}`} />
                                    </div>
                                    <span className="text-xs">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

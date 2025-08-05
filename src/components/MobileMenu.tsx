import { useContext, useState } from 'react';
import { AppContext, AppContextType } from '../App';
import { LayoutDashboard, Star, FileText, User, DollarSign, Settings, Users, TestTube2, Ticket, MoreHorizontal, X, BarChart3, Building2 } from 'lucide-react';
import Modal from './Modal';

// Komponen ini adalah menu navigasi bawah untuk tampilan mobile.
export default function MobileMenu() {
    const { page, setPage, session } = useContext(AppContext) as AppContextType;
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    
    const isSuperAdmin = session!.user.user_metadata?.role === 'superadmin';

    // --- PERBAIKAN: Mendefinisikan ulang item menu untuk Host dan Superadmin ---
    const hostNavItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'leaderboard', label: 'Papan Peringkat', icon: Star },
        { id: 'rekap', label: 'Rekap Live', icon: FileText },
        { id: 'salary', label: 'Gaji Saya', icon: DollarSign },
        { id: 'profile', label: 'Profil Saya', icon: User },
        { id: 'settings', label: 'Pengaturan Akun', icon: Settings },
    ];

    const superAdminNavItems = [
        ...hostNavItems,
        // Menambahkan menu khusus Superadmin
        { id: 'livetest', label: 'Uji Coba Live', icon: TestTube2 },
        { id: 'hosts', label: 'Manajemen Host', icon: Users },
        { id: 'users', label: 'Manajemen Pengguna', icon: Users },
        { id: 'tiktok', label: 'Manajemen Akun', icon: Ticket },
        { id: 'payroll', label: 'Sistem Gaji', icon: DollarSign },
        { id: 'analysis', label: 'Analisis Kinerja', icon: BarChart3 },
    ];

    const allItems = isSuperAdmin ? superAdminNavItems : hostNavItems;
    
    // Tentukan item mana yang akan ditampilkan di bar utama (maksimal 3 + "Lainnya")
    const mainItems = isSuperAdmin 
        ? allItems.filter(item => ['dashboard', 'hosts', 'rekap'].includes(item.id))
        : allItems.filter(item => ['dashboard', 'rekap', 'salary'].includes(item.id));
        
    const moreItems = allItems.filter(item => !mainItems.some(mainItem => mainItem.id === item.id));

    const handleMenuClick = (pageId: string) => {
        setPage(pageId);
        setIsMoreMenuOpen(false); // Tutup modal setelah item dipilih
    };

    return (
        <>
            {/* Bar Navigasi Bawah */}
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

            {/* Modal untuk Menu "Lainnya" */}
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

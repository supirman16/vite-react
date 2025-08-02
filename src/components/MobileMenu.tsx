import { useContext } from 'react';
import { AppContext, AppContextType } from '../App';
import { X } from 'lucide-react';

// Komponen ini bertanggung jawab untuk menampilkan menu navigasi geser di perangkat mobile.
export default function MobileMenu() {
    const { isMenuOpen, setIsMenuOpen, page, setPage, session } = useContext(AppContext) as AppContextType;
    const isSuperAdmin = session!.user.user_metadata?.role === 'superadmin';

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', roles: ['superadmin', 'host'] },
        { id: 'analysis', label: 'Analisis Kinerja', roles: ['superadmin', 'host'] },
        { id: 'rekap', label: 'Rekap Live', roles: ['superadmin', 'host'] },
        { id: 'profile', label: 'Profil Saya', roles: ['host'] },
        { id: 'my-salary', label: 'Gaji Saya', roles: ['host'] },
        { id: 'payroll', label: 'Sistem Gaji', roles: ['superadmin'] },
        { id: 'settings', label: 'Pengaturan Akun', roles: ['host'] },
        { id: 'hosts', label: 'Manajemen Host', roles: ['superadmin'] },
        { id: 'tiktok', label: 'Manajemen Akun', roles: ['superadmin'] },
        { id: 'users', label: 'Manajemen Pengguna', roles: ['superadmin'] },
    ];

    const userRole = isSuperAdmin ? 'superadmin' : 'host';
    const accessibleNavItems = navItems.filter(item => item.roles.includes(userRole));

    const handleLinkClick = (pageId: string) => {
        setPage(pageId);
        setIsMenuOpen(false);
    };

    if (!isMenuOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/60 z-40 animate-fade-in-fast"
                onClick={() => setIsMenuOpen(false)}
            ></div>
            
            {/* Sidebar Menu */}
            <div className="fixed top-0 left-0 h-full w-64 bg-white dark:bg-stone-800 shadow-lg z-50 animate-slide-in">
                <div className="p-4">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">Menu</h2>
                        <button onClick={() => setIsMenuOpen(false)} className="p-1 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <ul className="space-y-2">
                        {accessibleNavItems.map(item => (
                             <li key={item.id}>
                                <a 
                                    onClick={() => handleLinkClick(item.id)} 
                                    className={`block p-2 rounded-md cursor-pointer ${page === item.id ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' : 'hover:bg-stone-100 dark:hover:bg-stone-700'}`}
                                >
                                    {item.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </>
    );
}

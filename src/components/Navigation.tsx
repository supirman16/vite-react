import React, { useContext } from 'react';
import { AppContext, AppContextType } from '../App';
import { 
    LayoutDashboard, BarChart2, FileText, User, DollarSign, Settings, 
    Users, Smartphone
} from 'lucide-react';

// Komponen ini bertanggung jawab untuk merender bilah navigasi utama.
// Ia akan menampilkan menu yang berbeda tergantung pada peran pengguna.
export default function Navigation() {
    const { page, setPage, session } = useContext(AppContext) as AppContextType;
    const isSuperAdmin = session!.user.user_metadata?.role === 'superadmin';

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['superadmin', 'host'] },
        { id: 'analysis', label: 'Analisis Kinerja', icon: BarChart2, roles: ['superadmin', 'host'] },
        { id: 'rekap', label: 'Rekap Live', icon: FileText, roles: ['superadmin', 'host'] },
        { id: 'profile', label: 'Profil Saya', icon: User, roles: ['host'] },
        { id: 'my-salary', label: 'Gaji Saya', icon: DollarSign, roles: ['host'] },
        { id: 'payroll', label: 'Sistem Gaji', icon: DollarSign, roles: ['superadmin'] },
        { id: 'settings', label: 'Pengaturan Akun', icon: Settings, roles: ['host'] },
        { id: 'hosts', label: 'Manajemen Host', icon: Users, roles: ['superadmin'] },
        { id: 'tiktok', label: 'Manajemen Akun', icon: Smartphone, roles: ['superadmin'] },
        { id: 'users', label: 'Manajemen Pengguna', icon: Users, roles: ['superadmin'] },
    ];

    const userRole = isSuperAdmin ? 'superadmin' : 'host';
    const accessibleNavItems = navItems.filter(item => item.roles.includes(userRole));

    return (
        <nav className="hidden md:block mb-8 border-b border-stone-200 dark:border-stone-700">
            <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-stone-500 dark:text-stone-400">
                {accessibleNavItems.map(item => (
                    <li key={item.id} className="mr-2">
                        <a 
                            onClick={() => setPage(item.id)} 
                            className={`nav-link inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg group cursor-pointer ${page === item.id ? 'text-purple-600 border-purple-600 dark:text-purple-500 dark:border-purple-500' : 'border-transparent hover:text-stone-600 hover:border-stone-300 dark:hover:text-stone-300'}`}
                        >
                            <item.icon className="mr-2 h-5 w-5" />
                            {item.label}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

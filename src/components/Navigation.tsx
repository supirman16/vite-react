import { useContext } from 'react';
import { AppContext, AppContextType } from '../App';
import { LayoutDashboard, Star, FileText, User, DollarSign, Settings, Users, TestTube2, Ticket, BarChart3, Building2, LogOut } from 'lucide-react';

// ==================================================================
// KOMPONEN BARU: AnimatedLogo
// ==================================================================
function AnimatedLogo() {
    return (
        <svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F472B6" />
                    <stop offset="50%" stopColor="#A855F7" />
                    <stop offset="100%" stopColor="#22D3EE" />
                </linearGradient>
                <style>
                    {`
                        @keyframes flow {
                            0% { transform: rotate(0deg) scale(1.1); }
                            50% { transform: rotate(180deg) scale(1); }
                            100% { transform: rotate(360deg) scale(1.1); }
                        }
                        .shape {
                            animation: flow 20s linear infinite;
                            transform-origin: 50% 50%;
                        }
                    `}
                </style>
            </defs>
            <circle cx="50" cy="50" r="48" fill="url(#logoGradient)" />
            <g className="shape">
                <path d="M 20,50 C 20,20 80,20 80,50 C 80,80 20,80 20,50 Z" fill="#000" fillOpacity="0.1" />
                <path d="M 50,20 C 80,20 80,80 50,80 C 20,80 20,20 50,20 Z" fill="#FFF" fillOpacity="0.15" transform="rotate(45 50 50)" />
            </g>
        </svg>
    );
}


// ==================================================================
// FILE YANG DIPERBARUI: Navigation.tsx
// ==================================================================
export default function Navigation() {
    const context = useContext(AppContext);

    // Penjaga untuk mencegah crash saat konteks atau sesi belum siap
    if (!context || !context.session) {
        return null; 
    }

    const { page, setPage, session, logout } = context as AppContextType;

    // --- PERBAIKAN: Logika peran yang disederhanakan dan diperbaiki ---
    const userRole = session.user.user_metadata?.role;

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['host', 'superadmin'] },
        { id: 'leaderboard', label: 'Papan Peringkat', icon: Star, roles: ['host', 'superadmin'] },
        { id: 'analysis', label: 'Analisis Kinerja', icon: BarChart3, roles: ['superadmin'] },
        { id: 'rekap', label: 'Rekap Live', icon: FileText, roles: ['host', 'superadmin'] },
        { id: 'profile', label: 'Profil Saya', icon: User, roles: ['host'] },
        { id: 'salary', label: 'Gaji Saya', icon: DollarSign, roles: ['host'] },
        { id: 'payroll', label: 'Sistem Gaji', icon: DollarSign, roles: ['superadmin'] },
        { id: 'hosts', label: 'Manajemen Host', icon: Building2, roles: ['superadmin'] },
        { id: 'users', label: 'Manajemen Pengguna', icon: Users, roles: ['superadmin'] },
        { id: 'tiktok', label: 'Manajemen Akun', icon: Ticket, roles: ['superadmin'] },
        { id: 'livetest', label: 'Uji Coba Live', icon: TestTube2, roles: ['superadmin'] },
        { id: 'settings', label: 'Pengaturan Akun', icon: Settings, roles: ['host'] },
    ];

    // Logika filter yang benar
    const accessibleNavItems = navItems.filter(item => item.roles.includes(userRole));
    // ------------------------------------------------------------------

    return (
        <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-stone-800 border-r border-stone-200 dark:border-stone-700">
            <div className="h-16 flex items-center px-6 border-b border-stone-200 dark:border-stone-700">
                <div className="flex items-center gap-3">
                    <AnimatedLogo />
                    <span className="font-bold text-xl text-stone-800 dark:text-white">UNITY</span>
                </div>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                {accessibleNavItems.map(item => (
                    <button 
                        key={item.id} 
                        onClick={() => setPage(item.id)} 
                        className={`w-full flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                            page === item.id 
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' 
                                : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-700'
                        }`}
                    >
                        <item.icon className="h-5 w-5 mr-3" />
                        {item.label}
                    </button>
                ))}
            </nav>
            <div className="p-4 border-t border-stone-200 dark:border-stone-700">
                <button 
                    onClick={logout} 
                    className="w-full flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/50"
                >
                    <LogOut className="h-5 w-5 mr-3" />
                    Keluar
                </button>
            </div>
        </aside>
    );
}

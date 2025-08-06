import { useContext } from 'react';
import { AppContext, AppContextType } from '../App';
import { LayoutDashboard, Star, FileText, User, DollarSign, Settings, Users, TestTube2, Ticket, BarChart3, Building2, LogOut, X, ShieldCheck, Megaphone } from 'lucide-react';

export default function Navigation({ onClose }: { onClose?: () => void }) {
    const context = useContext(AppContext);

    if (!context || !context.session) {
        return null; 
    }

    const { page, setPage, session, logout, theme } = context as AppContextType;
    // --- PERBAIKAN: Kembali menggunakan user_metadata ---
    const userRole = session.user.user_metadata?.role;
    const userInitial = session.user.email ? session.user.email.charAt(0).toUpperCase() : '?';

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['host', 'superadmin'] },
        { id: 'announcements', label: 'Pengumuman', icon: Megaphone, roles: ['host', 'superadmin'] },
        { id: 'leaderboard', label: 'Papan Peringkat', icon: Star, roles: ['host', 'superadmin'] },
        { id: 'analysis', label: 'Analisis Kinerja', icon: BarChart3, roles: ['host', 'superadmin'] },
        { id: 'rekap', label: 'Rekap Live', icon: FileText, roles: ['host', 'superadmin'] },
        { id: 'profile', label: 'Profil Saya', icon: User, roles: ['host'] },
        { id: 'salary', label: 'Gaji Saya', icon: DollarSign, roles: ['host'] },
        { id: 'payroll', label: 'Sistem Gaji', icon: DollarSign, roles: ['superadmin'] },
        { id: 'hosts', label: 'Manajemen Host', icon: Building2, roles: ['superadmin'] },
        { id: 'users', label: 'Manajemen Pengguna', icon: Users, roles: ['superadmin'] },
        { id: 'tiktok', label: 'Manajemen Akun', icon: Ticket, roles: ['superadmin'] },
        { id: 'livetest', label: 'Uji Coba Live', icon: TestTube2, roles: ['superadmin'] },
        { id: 'settings', label: 'Pengaturan Akun', icon: Settings, roles: ['host', 'superadmin'] },
    ];

    const accessibleNavItems = navItems.filter(item => item.roles.includes(userRole));

    const handleLinkClick = (pageId: string) => {
        setPage(pageId);
        if (onClose) {
            onClose();
        }
    };

    return (
        <aside className="flex h-full flex-col w-64 bg-white dark:bg-stone-900 shadow-xl border-r border-stone-200 dark:border-stone-800">
            <div className="flex items-center justify-between px-6 h-20 border-b border-stone-200 dark:border-stone-800">
                <div className="flex items-center gap-3">
                    <img className="h-10 w-auto" src={theme === 'dark' ? 'https://i.imgur.com/L4a0239.png' : 'https://i.imgur.com/kwZdtFs.png'} alt="Unity Agency" />
                    <span className="font-bold text-xl text-stone-800 dark:text-white">UNITY</span>
                </div>
                <button onClick={onClose} className="md:hidden p-1 text-stone-500 dark:text-stone-400">
                    <X className="h-6 w-6" />
                </button>
            </div>
            
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {accessibleNavItems.map(item => (
                    <button 
                        key={item.id} 
                        onClick={() => handleLinkClick(item.id)} 
                        className={`w-full flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ease-in-out transform hover:translate-x-1 ${
                            page === item.id 
                                ? 'unity-gradient-bg text-white shadow-md' 
                                : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800'
                        }`}
                    >
                        <item.icon className="h-5 w-5 mr-3" />
                        {item.label}
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-stone-200 dark:border-stone-800">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 text-white flex items-center justify-center font-bold text-lg">
                        {userInitial}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-stone-800 dark:text-white truncate">{session.user.email}</p>
                        <div className="flex items-center">
                            <ShieldCheck className="h-4 w-4 text-green-500 mr-1.5" />
                            <p className="text-xs font-medium text-stone-500 dark:text-stone-400 capitalize">{userRole}</p>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={logout} 
                    className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-semibold rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"
                >
                    <LogOut className="h-5 w-5 mr-2" />
                    <span>Keluar</span>
                </button>
            </div>
        </aside>
    );
}

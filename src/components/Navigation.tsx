import { useContext } from 'react';
import { AppContext, AppContextType } from '../App';
import { LayoutDashboard, Star, FileText, FileCheck, User, DollarSign, Settings, Users, Ticket, BarChart3, Building2, LogOut, X, ShieldCheck, Megaphone, Award } from 'lucide-react';

export default function Navigation({ onClose }: { onClose?: () => void }) {
    const context = useContext(AppContext);
    if (!context) return null; 

    const { page, setPage, session, logout, theme } = context as AppContextType;
    if (!session) return null;

    const userRole = session.user.user_metadata?.role;
    const userInitial = session.user.email ? session.user.email.charAt(0).toUpperCase() : '?';

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['host', 'superadmin'] },
        // --- PERBAIKAN DI SINI: Menambahkan 'superadmin' ke roles ---
        { id: 'achievements', label: 'Pencapaian', icon: Award, roles: ['host', 'superadmin'] },
        { id: 'announcements', label: 'Pengumuman', icon: Megaphone, roles: ['host', 'superadmin'] },
        { id: 'leaderboard', label: 'Papan Peringkat', icon: Star, roles: ['host', 'superadmin'] },
        { id: 'analysis', label: 'Analisis Kinerja', icon: BarChart3, roles: ['host', 'superadmin'] },
        { id: 'rekap', label: 'Rekap Live', icon: FileText, roles: ['host', 'superadmin'] },
        { id: 'audit', label: 'Audit Rekap Live', icon: FileCheck, roles: ['superadmin'] },
        { id: 'profile', label: 'Profil Saya', icon: User, roles: ['host'] },
        { id: 'salary', label: 'Gaji Saya', icon: DollarSign, roles: ['host'] },
        { id: 'payroll', label: 'Sistem Gaji', icon: DollarSign, roles: ['superadmin'] },
        { id: 'hosts', label: 'Manajemen Host', icon: Building2, roles: ['superadmin'] },
        { id: 'users', label: 'Manajemen Pengguna', icon: Users, roles: ['superadmin'] },
        { id: 'tiktok', label: 'Manajemen Akun', icon: Ticket, roles: ['superadmin'] },
        { id: 'settings', label: 'Pengaturan Akun', icon: Settings, roles: ['host', 'superadmin'] },
    ];

    const accessibleNavItems = navItems.filter(item => item.roles.includes(userRole));
    const handleLinkClick = (pageId: string) => { setPage(pageId); if (onClose) onClose(); };

    return (
        <aside className="relative flex h-full flex-col w-64 bg-white dark:bg-stone-900 shadow-2xl border-r-[3px] border-stone-900 dark:border-stone-800 transition-all duration-300">
            {/* Sidebar Logo */}
            <div className="flex items-center justify-between px-6 h-20 border-b border-purple-100 dark:border-cyan-900/20">
                <div className="flex items-center gap-3">
                    <img className="h-10 w-auto animate-float-slow" src={theme === 'dark' ? 'https://i.imgur.com/L4a0239.png' : 'https://i.imgur.com/kwZdtFs.png'} alt="Unity Agency" />
                    <span className="font-extrabold text-xl bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 bg-clip-text text-transparent">UNITY</span>
                </div>
                <button onClick={onClose} className="md:hidden p-1 text-stone-500 dark:text-stone-400 hover:text-pink-500"><X className="h-6 w-6" /></button>
            </div>

            {/* Anime Mascot Welcome Box - Manga Stylized */}
            <div className="px-4 py-4 flex flex-col items-center border-b-[3px] border-stone-900 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-900/40 relative overflow-hidden manga-screentone">
                {/* Speech Bubble: Comic Style */}
                <div className="relative bg-white dark:bg-stone-800 border-[3px] border-stone-900 dark:border-stone-100 px-3 py-2 rounded-xl shadow-[3px_3px_0px_0px_#ec4899] dark:shadow-[3px_3px_0px_0px_#06b6d4] text-center mb-4 max-w-[92%] transform -rotate-1">
                    <p className="text-[11px] font-bold text-stone-900 dark:text-white leading-tight">
                        {userRole === 'superadmin' ? 'Dashboard Siap, Master! ( •̀ ω •́)y 👑' : 'Semangat live hari ini, Senpai! (≧◡≦) ✨'}
                    </p>
                    {/* Comic dialogue tail pointer */}
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-stone-800 border-r-[3px] border-b-[3px] border-stone-900 dark:border-stone-100 transform rotate-45"></div>
                </div>

                {/* Mascot Image with floating animation - Circular Badge Frame */}
                <div className="relative w-20 h-20 animate-float-slow flex items-center justify-center rounded-full overflow-hidden border-[3px] border-stone-900 dark:border-stone-100 bg-white dark:bg-stone-800 p-1 shadow-[3px_3px_0px_0px_#ec4899] dark:shadow-[3px_3px_0px_0px_#06b6d4]">
                    <img 
                        src="/anime_mascot.png" 
                        alt="Unity Mascot" 
                        className="w-full h-full object-cover rounded-full"
                    />
                </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-thin">
                {accessibleNavItems.map(item => {
                    const isActive = page === item.id;
                    return (
                        <button 
                            key={item.id} 
                            onClick={() => handleLinkClick(item.id)} 
                            className={`w-full flex items-center px-4 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ease-in-out group relative ${ isActive ? 'bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-cyan-500/10 text-pink-600 dark:text-cyan-300 shadow-sm border-l-4 border-pink-500 dark:border-cyan-400' : 'text-stone-600 dark:text-stone-300 hover:bg-pink-500/5 dark:hover:bg-cyan-400/5 hover:text-pink-600 dark:hover:text-cyan-300 hover:translate-x-1.5'}`}
                        >
                            <item.icon className={`h-5 w-5 mr-3 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-pink-500 dark:text-cyan-400' : 'text-stone-400 dark:text-stone-500 group-hover:text-pink-500 dark:group-hover:text-cyan-400'}`} />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            {/* Mascot peeking from behind user profile card - at aside level for proper z-index layering */}
            <div className="absolute bottom-[72px] right-0 w-28 h-36 pointer-events-none z-0 select-none animate-float-slow">
                <img 
                    src="/sidebar_mascot.png" 
                    alt="Sidebar Mascot" 
                    className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                />
            </div>

            {/* User Profile Footer */}
            <div className="px-4 pt-2 pb-4 border-t border-purple-100 dark:border-cyan-900/20 bg-stone-50/20 dark:bg-stone-900/20">
                {/* Profile card - z-10 so it sits IN FRONT of the mascot */}
                <div className="flex items-center gap-3 mb-4 mt-2 p-2.5 rounded-xl bg-white/90 dark:bg-stone-800/80 border-2 border-stone-900 dark:border-stone-100 shadow-[2px_2px_0px_0px_#ec4899] dark:shadow-[2px_2px_0px_0px_#06b6d4] relative z-10">
                    <div className="h-10 w-10 rounded-full unity-gradient-bg text-white flex items-center justify-center font-extrabold text-lg flex-shrink-0 border-2 border-stone-900 dark:border-stone-100 shadow-sm">
                        {userInitial}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate">{session.user.email}</p>
                        <div className="flex items-center mt-0.5">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 mr-1" />
                            <p className="text-[10px] font-extrabold text-stone-500 dark:text-stone-400 capitalize tracking-wider">{userRole}</p>
                        </div>
                    </div>
                </div>
                <button onClick={logout} className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-bold rounded-lg text-red-500 hover:bg-red-500/10 hover:shadow-sm transition-all duration-200 relative z-10"><LogOut className="h-5 w-5 mr-2" /><span>Keluar</span></button>
            </div>
        </aside>
    );
}

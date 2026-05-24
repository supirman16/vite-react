import { useContext, useState, useEffect, useRef } from 'react';
import { AppContext, AppContextType } from '../App';
import { LogOut, Sun, Moon, Menu, User, Settings, ShieldCheck } from 'lucide-react';

interface HeaderProps {
    onMenuClick: () => void;
}

const pageTitles: { [key: string]: string } = {
    dashboard: 'Dashboard',
    leaderboard: 'Papan Peringkat',
    analysis: 'Analisis Kinerja',
    rekap: 'Rekap Live',
    profile: 'Profil Saya',
    salary: 'Gaji Saya',
    payroll: 'Sistem Gaji',
    hosts: 'Manajemen Host',
    users: 'Manajemen Pengguna',
    tiktok: 'Manajemen Akun',
    settings: 'Pengaturan Akun',
    announcements: 'Pengumuman'
};

export default function Header({ onMenuClick }: HeaderProps) {
    const { theme, setTheme, logout, session, setPage, page } = useContext(AppContext) as AppContextType;
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    // --- PERBAIKAN: Kembali menggunakan user_metadata ---
    const userRole = session?.user?.user_metadata?.role;
    const isSuperAdmin = userRole === 'superadmin';
    const currentPageTitle = pageTitles[page] || 'Dashboard';

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [profileMenuRef]);

    const handleProfileMenuClick = (pageName: string) => {
        setPage(pageName);
        setIsProfileOpen(false);
    }

    const userInitial = session?.user?.email ? session.user.email.charAt(0).toUpperCase() : '?';

    return (
        <header className="flex justify-between items-center px-4 md:px-6 py-4 h-20 bg-white/60 dark:bg-stone-900/60 backdrop-blur-md border-b border-purple-200/40 dark:border-cyan-900/30 transition-all duration-300">
            <div className="flex items-center space-x-4">
                <button 
                    onClick={onMenuClick}
                    className="md:hidden p-2 rounded-full hover:bg-pink-500/10 dark:hover:bg-cyan-400/10 transition-colors text-stone-700 dark:text-stone-300"
                    aria-label="Buka menu"
                >
                    <Menu className="h-6 w-6" />
                </button>
                
                <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 tracking-wide filter drop-shadow-[0_0_10px_rgba(236,72,153,0.15)] dark:drop-shadow-[0_0_10px_rgba(6,182,212,0.15)]">
                    {currentPageTitle}
                </h1>
            </div>

            <div className="flex items-center space-x-3">
                <button 
                    onClick={toggleTheme} 
                    title="Ubah Tema" 
                    className="p-2 rounded-full text-stone-600 dark:text-stone-300 hover:bg-pink-500/10 dark:hover:bg-cyan-400/10 hover:text-pink-500 dark:hover:text-cyan-300 transition-colors"
                >
                    {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </button>
                
                <div className="relative" ref={profileMenuRef}>
                    <button 
                        onClick={() => setIsProfileOpen(!isProfileOpen)} 
                        className="h-10 w-10 rounded-full unity-gradient-bg text-white flex items-center justify-center font-extrabold text-lg hover:scale-105 active:scale-95 transition-all shadow-md shadow-neon-pink/20 dark:shadow-neon-cyan/20"
                    >
                        {userInitial}
                    </button>
                    {isProfileOpen && (
                        <div className="origin-top-right absolute right-0 mt-2.5 w-64 rounded-xl shadow-2xl bg-white/95 dark:bg-stone-800/95 backdrop-blur-md border border-purple-100 dark:border-cyan-500/20 focus:outline-none z-10 animate-fade-in">
                            <div className="py-2">
                                <div className="px-4 py-3 border-b border-purple-100 dark:border-cyan-900/20">
                                    <p className="text-sm font-bold text-stone-800 dark:text-white truncate" title={session?.user?.email}>{session?.user?.email}</p>
                                    <div className="flex items-center mt-1">
                                        <ShieldCheck className="h-4 w-4 text-emerald-500 mr-1.5" />
                                        <p className="text-[10px] font-extrabold text-stone-500 dark:text-stone-400 capitalize tracking-wider">{userRole}</p>
                                    </div>
                                </div>
                                <div className="py-1">
                                    {!isSuperAdmin && (
                                        <>
                                            <a href="#" onClick={() => handleProfileMenuClick('profile')} className="flex items-center px-4 py-2.5 text-sm font-bold text-stone-600 dark:text-stone-300 hover:bg-pink-500/5 dark:hover:bg-cyan-400/5 hover:text-pink-600 dark:hover:text-cyan-300 transition-colors">
                                                <User className="mr-3 h-5 w-5 text-stone-400 group-hover:text-pink-500" />
                                                <span>Profil Saya</span>
                                            </a>
                                            <a href="#" onClick={() => handleProfileMenuClick('settings')} className="flex items-center px-4 py-2.5 text-sm font-bold text-stone-600 dark:text-stone-300 hover:bg-pink-500/5 dark:hover:bg-cyan-400/5 hover:text-pink-600 dark:hover:text-cyan-300 transition-colors">
                                                <Settings className="mr-3 h-5 w-5 text-stone-400 group-hover:text-pink-500" />
                                                <span>Pengaturan Akun</span>
                                            </a>
                                        </>
                                    )}
                                </div>
                                <div className="py-1 border-t border-purple-100 dark:border-cyan-900/20">
                                    <a href="#" onClick={logout} className="flex items-center px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors">
                                        <LogOut className="mr-3 h-5 w-5 text-red-400" />
                                        <span>Logout</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

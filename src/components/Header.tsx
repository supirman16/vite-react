import { useContext, useState, useEffect, useRef } from 'react';
import { AppContext, AppContextType } from '../App';
import { LogOut, Sun, Moon, Menu, User, Settings, ShieldCheck, Sparkles } from 'lucide-react';

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
    livetest: 'Uji Coba Live',
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
        <header className="flex justify-between items-center px-4 md:px-6 py-4 h-20 bg-white/70 dark:bg-stone-900/70 backdrop-blur-lg border-b border-stone-200/80 dark:border-stone-800/80">
            <div className="flex items-center space-x-4">
                <button 
                    onClick={onMenuClick}
                    className="md:hidden p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                    aria-label="Buka menu"
                >
                    <Menu className="h-6 w-6 text-stone-700 dark:text-stone-300" />
                </button>
                
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500">
                    {currentPageTitle}
                </h1>
            </div>

            <div className="flex items-center space-x-3">
                <button 
                    onClick={toggleTheme} 
                    title="Ubah Tema" 
                    className="p-2 rounded-full text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                >
                    {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </button>
                
                <div className="relative" ref={profileMenuRef}>
                    <button 
                        onClick={() => setIsProfileOpen(!isProfileOpen)} 
                        className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 text-white flex items-center justify-center font-bold text-lg hover:scale-105 transition-transform"
                    >
                        {userInitial}
                    </button>
                    {isProfileOpen && (
                        <div className="origin-top-right absolute right-0 mt-2 w-64 rounded-xl shadow-2xl bg-white dark:bg-stone-800 ring-1 ring-black/5 focus:outline-none z-10 animate-fade-in">
                            <div className="py-2">
                                <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-700">
                                    <p className="text-sm font-semibold text-stone-900 dark:text-white truncate" title={session?.user?.email}>{session?.user?.email}</p>
                                    <div className="flex items-center mt-1">
                                        <ShieldCheck className="h-4 w-4 text-green-500 mr-1.5" />
                                        <p className="text-xs font-medium text-stone-500 dark:text-stone-400 capitalize">{userRole}</p>
                                    </div>
                                </div>
                                <div className="py-1">
                                    {!isSuperAdmin && (
                                        <>
                                            <a href="#" onClick={() => handleProfileMenuClick('profile')} className="flex items-center px-4 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700">
                                                <User className="mr-3 h-5 w-5" />
                                                <span>Profil Saya</span>
                                            </a>
                                            <a href="#" onClick={() => handleProfileMenuClick('settings')} className="flex items-center px-4 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700">
                                                <Settings className="mr-3 h-5 w-5" />
                                                <span>Pengaturan Akun</span>
                                            </a>
                                        </>
                                    )}
                                </div>
                                <div className="py-1 border-t border-stone-200 dark:border-stone-700">
                                    <a href="#" onClick={logout} className="flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50">
                                        <LogOut className="mr-3 h-5 w-5" />
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

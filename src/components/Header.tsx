import { useContext, useState, useEffect, useRef } from 'react';
import { AppContext, AppContextType } from '../App';
import { LogOut, Sun, Moon, Menu, User, Settings } from 'lucide-react';

// Komponen ini bertanggung jawab untuk merender bagian header aplikasi.
export default function Header() {
    const { theme, setTheme, handleLogout, setIsMenuOpen, session, setPage } = useContext(AppContext) as AppContextType;
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const isSuperAdmin = session?.user?.user_metadata?.role === 'superadmin';

    const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

    // Menutup dropdown saat pengguna mengklik di luar area menu
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

    const handleMenuClick = (pageName: string) => {
        setPage(pageName);
        setIsProfileOpen(false);
    }

    // Mengambil inisial dari email pengguna
    const userInitial = session?.user?.email ? session.user.email.charAt(0).toUpperCase() : '?';

    return (
        <header className="mb-8 flex justify-between items-center p-4 bg-white/50 dark:bg-stone-800/50 backdrop-blur-sm sticky top-4 z-20 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700">
            <div className="flex items-center space-x-4">
                <button 
                    onClick={() => setIsMenuOpen(true)} 
                    className="md:hidden p-2 rounded-md hover:bg-stone-100 dark:hover:bg-stone-700"
                    aria-label="Buka menu"
                >
                    <Menu className="h-6 w-6" />
                </button>
                {/* Logo berubah sesuai tema */}
                <img className="h-10 w-auto" src={theme === 'dark' ? 'https://i.imgur.com/L4a0239.png' : 'https://i.imgur.com/kwZdtFs.png'} alt="Unity Agency" />
            </div>
            <div className="flex items-center space-x-2">
                <button 
                    onClick={toggleTheme} 
                    title="Ubah Tema" 
                    className="p-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                >
                    {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </button>
                
                {/* Menu Profil Dropdown */}
                <div className="relative" ref={profileMenuRef}>
                    <button 
                        onClick={() => setIsProfileOpen(!isProfileOpen)} 
                        className="h-9 w-9 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm hover:opacity-90 transition-opacity"
                    >
                        {userInitial}
                    </button>
                    {isProfileOpen && (
                        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-stone-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-10 animate-fade-in">
                            <div className="py-1">
                                <div className="px-4 py-2 border-b dark:border-stone-700">
                                    <p className="text-sm text-stone-500 dark:text-stone-400">Login sebagai</p>
                                    <p className="text-sm font-medium text-stone-900 dark:text-white truncate">{session?.user?.email}</p>
                                </div>
                                {!isSuperAdmin && (
                                    <>
                                        <a href="#" onClick={() => handleMenuClick('profile')} className="flex items-center px-4 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700">
                                            <User className="mr-3 h-5 w-5" />
                                            <span>Profil Saya</span>
                                        </a>
                                        <a href="#" onClick={() => handleMenuClick('settings')} className="flex items-center px-4 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700">
                                            <Settings className="mr-3 h-5 w-5" />
                                            <span>Pengaturan Akun</span>
                                        </a>
                                    </>
                                )}
                                <a href="#" onClick={handleLogout} className="flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50">
                                    <LogOut className="mr-3 h-5 w-5" />
                                    <span>Logout</span>
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

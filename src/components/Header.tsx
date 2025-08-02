import { useContext } from 'react';
import { AppContext, AppContextType } from '../App';
import { LogOut, Sun, Moon, Menu } from 'lucide-react';

// Komponen ini bertanggung jawab untuk merender bagian header aplikasi.
export default function Header() {
    const { theme, setTheme, handleLogout, setIsMenuOpen, session } = useContext(AppContext) as AppContextType;
    
    const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

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
                <img className="h-10 w-auto" src="https://i.imgur.com/kwZdtFs.png" alt="Unity Agency" />
            </div>
            <div className="flex items-center space-x-4">
                <span className="hidden sm:inline text-sm text-stone-600 dark:text-stone-300">{session?.user?.email}</span>
                <button 
                    onClick={toggleTheme} 
                    title="Ubah Tema" 
                    className="p-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                >
                    {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </button>
                <button 
                    onClick={handleLogout} 
                    title="Logout" 
                    className="p-2 rounded-full text-red-600 hover:bg-red-100 dark:text-red-500 dark:hover:bg-red-900/50 transition-colors"
                >
                    <LogOut className="h-5 w-5" />
                </button>
            </div>
        </header>
    );
}

import React, { useContext } from 'react';
import { AppContext, AppContextType } from '../App';
import { LogOut, Sun, Moon, Menu } from 'lucide-react';

// Komponen ini bertanggung jawab untuk merender bagian header aplikasi,
// termasuk logo, tombol menu mobile, tombol tema, dan tombol logout.
export default function Header() {
    const { theme, setTheme, handleLogout, setIsMenuOpen } = useContext(AppContext) as AppContextType;
    
    const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

    return (
        <header className="mb-8 flex justify-between items-center">
            <div className="flex items-center space-x-4">
                <button 
                    onClick={() => setIsMenuOpen(true)} 
                    className="md:hidden p-2 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800"
                    aria-label="Buka menu"
                >
                    <Menu className="h-6 w-6" />
                </button>
                <img className="h-14 w-auto" src="https://i.imgur.com/kwZdtFs.png" alt="Unity Agency" />
            </div>
            <div className="flex items-center space-x-2">
                <button 
                    onClick={toggleTheme} 
                    title="Ubah Tema" 
                    className="p-2 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                    {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </button>
                <button 
                    onClick={handleLogout} 
                    title="Logout" 
                    className="p-2 rounded-md text-red-600 hover:bg-red-100 dark:text-red-500 dark:hover:bg-red-900/50"
                >
                    <LogOut className="h-5 w-5" />
                </button>
            </div>
        </header>
    );
}

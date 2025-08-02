import React, { useState, useContext } from 'react';
import { AppContext, AppContextType, supabase } from '../App';

// Komponen ini bertanggung jawab untuk menampilkan dan mengelola formulir login.
export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setError('Email atau password salah.');
        }
        // Jika berhasil, onAuthStateChange di App.tsx akan menangani sisanya.
        setLoading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg dark:bg-stone-800/50 dark:border dark:border-stone-700">
                <div className="text-center">
                    <img className="mx-auto h-20 w-auto" src="https://i.imgur.com/kwZdtFs.png" alt="Unity Agency" />
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-stone-900 dark:text-white">Dashboard Login</h2>
                    <p className="mt-2 text-center text-sm text-stone-600 dark:text-stone-400">
                        Selamat Datang Kembali!
                    </p>
                </div>
                <form onSubmit={handleLogin} className="mt-8 space-y-6">
                    <div>
                        <label htmlFor="email" className="sr-only">Alamat email</label>
                        <input 
                            id="email" 
                            name="email" 
                            type="email" 
                            autoComplete="email" 
                            required 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="relative block w-full appearance-none rounded-md border border-stone-300 px-3 py-2 text-stone-900 placeholder-stone-500 focus:z-10 focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm dark:bg-stone-700 dark:border-stone-600 dark:placeholder-stone-400 dark:text-white" 
                            placeholder="Alamat email" 
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="sr-only">Password</label>
                        <input 
                            id="password" 
                            name="password" 
                            type="password" 
                            autoComplete="current-password" 
                            required 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="relative block w-full appearance-none rounded-md border border-stone-300 px-3 py-2 text-stone-900 placeholder-stone-500 focus:z-10 focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm dark:bg-stone-700 dark:border-stone-600 dark:placeholder-stone-400 dark:text-white" 
                            placeholder="Password" 
                        />
                    </div>
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    <div>
                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="group relative flex w-full justify-center rounded-md border border-transparent unity-gradient-bg px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-75 transition-opacity"
                        >
                            {loading ? 'Loading...' : 'Login'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

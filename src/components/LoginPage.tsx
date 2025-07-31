import React, { useState } from 'react';
import { supabase } from '../App';

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
        <div className="flex items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg dark:bg-stone-800">
                <div>
                    <img className="mx-auto h-20 w-auto" src="https://i.imgur.com/kwZdtFs.png" alt="Unity Agency" />
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-stone-900 dark:text-white">Login ke Dashboard</h2>
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
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                    <div>
                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="group relative flex w-full justify-center rounded-md border border-transparent bg-gradient-to-r from-purple-600 to-blue-500 py-2 px-4 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-75"
                        >
                            {loading ? 'Loading...' : 'Login'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

import { useState, FormEvent } from 'react';
import { supabase } from '../App';

// Komponen ini adalah halaman Login untuk aplikasi.
export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
        }
        // Jika berhasil, App.tsx akan menangani navigasi
        
        setLoading(false);
    };

    return (
        <div 
            className="relative min-h-screen" // Menambahkan 'relative' untuk posisi overlay
            style={{ 
                backgroundImage: `url('/background.png')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}
        >
            {/* --- LAPISAN OVERLAY BARU --- */}
            {/* Lapisan ini akan meredupkan background agar teks lebih mudah dibaca */}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center px-4">
            
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center">
                        <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">
                            Selamat Datang Kembali
                        </h2>
                        <p className="mt-2 text-sm text-stone-300">
                            Masuk untuk melanjutkan ke dasbor Anda
                        </p>
                    </div>
                    <form 
                        className="mt-8 space-y-6 bg-white dark:bg-stone-800/80 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-stone-200 dark:border-stone-700" 
                        onSubmit={handleLogin}
                    >
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <label htmlFor="email-address" className="sr-only">Alamat Email</label>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="relative block w-full appearance-none rounded-t-md border border-stone-300 px-3 py-2 text-stone-900 placeholder-stone-500 focus:z-10 focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm dark:bg-stone-700 dark:border-stone-600 dark:text-white dark:placeholder-stone-400"
                                    placeholder="Alamat Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="password-2" className="sr-only">Password</label>
                                <input
                                    id="password-2"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="relative block w-full appearance-none rounded-b-md border border-stone-300 px-3 py-2 text-stone-900 placeholder-stone-500 focus:z-10 focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm dark:bg-stone-700 dark:border-stone-600 dark:text-white dark:placeholder-stone-400"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>
                        
                        {error && (
                            <div className="text-sm text-red-600 dark:text-red-400 text-center">
                                {error}
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative flex w-full justify-center rounded-md border border-transparent unity-gradient-bg py-2 px-4 text-sm font-semibold text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-75"
                            >
                                {loading ? 'Memuat...' : 'Masuk'}
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    );
}

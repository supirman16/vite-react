import { useState, FormEvent } from 'react';
import { supabase } from '../App';

// Komponen halaman Login dengan tema Manga & Anime Neo-Brutalist (Persona 5 style)
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
        setLoading(false);
    };

    return (
        <div 
            className="relative min-h-screen bg-stone-950 flex items-center justify-center p-4 overflow-hidden"
            style={{ 
                backgroundImage: `url('/background.png')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}
        >
            {/* Ambient cyan and pink glow orbs in the background */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-pink-500/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Main Neo-Brutalist Manga Panel Card */}
            <div className="w-full max-w-5xl bg-white dark:bg-stone-900 rounded-2xl z-10 transition-all duration-300 manga-panel overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12">
                    
                    {/* Sisi Kiri: Banner Maskot Manga (lg: col-span-5) */}
                    <div className="lg:col-span-5 bg-gradient-to-br from-pink-500/30 via-purple-600/35 to-cyan-500/30 p-8 flex flex-col justify-between items-center text-center relative border-b-2 lg:border-b-0 lg:border-r-2 border-stone-900 dark:border-stone-100 manga-screentone">
                        
                        {/* Speed Lines Overlay */}
                        <div className="absolute inset-0 manga-speed-lines pointer-events-none opacity-40"></div>
                        
                        <div className="relative z-10">
                            <span className="px-3 py-1 text-[9px] font-extrabold uppercase tracking-widest text-stone-900 dark:text-white bg-white dark:bg-stone-800 border-2 border-stone-900 dark:border-stone-100 rounded-full shadow-[2px_2px_0px_0px_#ec4899] dark:shadow-[2px_2px_0px_0px_#06b6d4]">
                                Virtual Management Portal
                            </span>
                            <h2 className="mt-5 text-3xl font-extrabold text-stone-900 dark:text-white leading-tight">
                                Selamat Datang Kembali!
                            </h2>
                            <p className="mt-2 text-xs font-bold text-stone-800 dark:text-stone-300">
                                Kelola siaran streaming Anda dengan dasbor agensi bertenaga AI ( •̀ ω •́)y
                            </p>
                        </div>

                        {/* Large Animated Mascot in Neon Circle - Circular Badge Frame */}
                        <div className="relative w-48 h-48 sm:w-56 sm:h-56 my-6 flex items-center justify-center">
                            {/* Glowing Neon Portal Rings */}
                            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-pink-500 via-purple-600 to-cyan-500 opacity-20 blur-md animate-pulse"></div>
                            <div className="absolute w-[95%] h-[95%] rounded-full border-2 border-stone-900 dark:border-stone-100 border-dashed animate-spin [animation-duration:18s]"></div>
                            
                            {/* Mask the square cityscape image into a perfect circular manga badge */}
                            <div className="w-[80%] h-[80%] rounded-full border-[3px] border-stone-900 dark:border-stone-100 overflow-hidden shadow-[4px_4px_0px_0px_#ec4899] dark:shadow-[4px_4px_0px_0px_#06b6d4] bg-white dark:bg-stone-950 z-10 animate-float-slow shrink-0 flex items-center justify-center p-1">
                                <img 
                                    src="/anime_mascot.png" 
                                    alt="Mascot Welcome" 
                                    className="w-full h-full object-cover rounded-full"
                                />
                            </div>
                        </div>

                        <div className="relative z-10">
                            {/* Bangers shouting brand title */}
                            <h3 className="bangers-font text-5xl bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 bg-clip-text text-transparent tracking-widest leading-none filter drop-shadow-[2px_2px_0px_rgba(0,0,0,0.15)]">
                                UNITY AGENCY
                            </h3>
                            <p className="text-[10px] font-extrabold text-stone-800 dark:text-stone-300 uppercase tracking-widest mt-1">
                                High-Tech Streaming Agency Portal
                            </p>
                        </div>
                    </div>

                    {/* Sisi Kanan: Form Login (lg: col-span-7) */}
                    <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center bg-stone-50/30 dark:bg-stone-900/10 backdrop-blur-sm">
                        <div className="w-full max-w-md mx-auto space-y-6">
                            <div>
                                <h3 className="text-2xl font-extrabold text-stone-900 dark:text-white flex items-center">
                                    Masuk ke Akun Anda 🚀
                                </h3>
                                <p className="text-xs font-bold text-stone-500 dark:text-stone-400 mt-1">
                                    Silakan masukkan kredensial email dan password Anda untuk masuk ke sistem.
                                </p>
                            </div>

                            <form className="space-y-5" onSubmit={handleLogin}>
                                <div>
                                    <label htmlFor="email-address" className="block text-xs font-extrabold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">Alamat Email</label>
                                    <input
                                        id="email-address"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="block w-full rounded-xl border-2 border-stone-900 px-3.5 py-3 text-stone-950 placeholder-stone-400 focus:border-pink-500 focus:outline-none focus:ring-4 focus:ring-pink-500/10 sm:text-sm dark:bg-stone-800/80 dark:border-stone-100 dark:text-white dark:placeholder-stone-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/10 transition-all duration-200"
                                        placeholder="nama@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                
                                <div>
                                    <label htmlFor="password-2" className="block text-xs font-extrabold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">Password</label>
                                    <input
                                        id="password-2"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        className="block w-full rounded-xl border-2 border-stone-900 px-3.5 py-3 text-stone-950 placeholder-stone-400 focus:border-pink-500 focus:outline-none focus:ring-4 focus:ring-pink-500/10 sm:text-sm dark:bg-stone-800/80 dark:border-stone-100 dark:text-white dark:placeholder-stone-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/10 transition-all duration-200"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>

                                {error && (
                                    <div className="text-xs font-extrabold text-red-600 dark:text-red-400 text-center bg-red-500/10 border-2 border-red-500 p-2.5 rounded-lg">
                                        ⚠️ Gagal Masuk: {error} (・_・;)
                                    </div>
                                )}

                                <div className="pt-3">
                                    {/* Neo-brutalist interactive cartoon submit button */}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full flex justify-center py-3.5 px-4 rounded-xl font-extrabold text-sm text-white unity-gradient-bg border-2 border-stone-900 dark:border-stone-100 shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_0px_#000] dark:hover:shadow-[5px_5px_0px_0px_#fff] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#000] disabled:opacity-50 transition-all duration-200"
                                    >
                                        {loading ? (
                                            <div className="flex items-center space-x-2">
                                                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                                                <span>Memproses Masuk... (・_・;)</span>
                                            </div>
                                        ) : (
                                            <span className="flex items-center">
                                                Masuk ke Dasbor Senpai! 🌟
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

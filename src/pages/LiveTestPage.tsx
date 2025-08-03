import { useContext, useState } from 'react';
import { AppContext, AppContextType } from '../App';

// Komponen ini sekarang akan memeriksa status live melalui API Vercel.
export default function LiveTestPage() {
    const { data } = useContext(AppContext) as AppContextType;
    const [selectedUsername, setSelectedUsername] = useState<string>('');
    const [connectionStatus, setConnectionStatus] = useState('Menunggu untuk memulai...');
    const [isConnecting, setIsConnecting] = useState(false);

    const handleTestConnection = async () => {
        if (!selectedUsername) {
            setConnectionStatus('Silakan pilih username terlebih dahulu.');
            return;
        }

        setIsConnecting(true);
        setConnectionStatus(`Memeriksa status live untuk @${selectedUsername}...`);
        
        try {
            // Panggil API backend Vercel Anda.
            const response = await fetch('/api/get-live-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: selectedUsername }),
            });

            if (!response.ok) {
                // Ini akan menangani eror jaringan atau eror 500 dari server
                throw new Error(`Server merespons dengan status ${response.status}`);
            }

            const result = await response.json();

            if (result.isLive) {
                setConnectionStatus(`BERHASIL: @${selectedUsername} sedang live. Room ID: ${result.roomId || 'N/A'}`);
            } else {
                setConnectionStatus(`INFO: @${selectedUsername} sedang tidak live. Pesan: ${result.error || 'Tidak ada sesi live yang ditemukan.'}`);
            }

        } catch (err: any) {
            setConnectionStatus(`GAGAL terhubung ke API: ${err.message}`);
        } finally {
            setIsConnecting(false);
        }
    };

    return (
        <section>
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100">Uji Status TikTok LIVE</h2>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Pilih satu akun untuk memeriksa apakah sedang live.</p>
            </div>

            <div className="bg-white dark:bg-stone-800 p-6 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <select 
                        value={selectedUsername} 
                        onChange={(e) => setSelectedUsername(e.target.value)}
                        className="bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 dark:bg-stone-700 dark:border-stone-600"
                    >
                        <option value="">Pilih Akun TikTok Aktif</option>
                        {data.tiktokAccounts.filter(acc => acc.status === 'Aktif').map(acc => (
                            <option key={acc.id} value={acc.username}>{acc.username}</option>
                        ))}
                    </select>
                    <button 
                        onClick={handleTestConnection} 
                        disabled={isConnecting}
                        className="w-full sm:w-auto unity-gradient-bg text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:opacity-90 flex items-center justify-center disabled:opacity-75"
                    >
                        {isConnecting ? 'Memeriksa...' : 'Test Status Live'}
                    </button>
                </div>

                <div className="mt-6">
                    <h3 className="text-lg font-medium">Status Koneksi:</h3>
                    <pre className="mt-2 p-4 bg-stone-100 dark:bg-stone-900 rounded-md text-sm whitespace-pre-wrap break-all">{connectionStatus}</pre>
                </div>
            </div>
        </section>
    );
}

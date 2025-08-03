import { useContext, useState, useEffect, useRef } from 'react';
import { AppContext, AppContextType } from '../App';
// Impor SDK resmi dari EulerStream
import { EulerAPI } from '@eulerstream/euler-api-sdk';

// Kunci API EulerStream Anda
const EULER_STREAM_API_KEY = "ZTlhMTg4YzcyMTRhNWY1ZTk2ZTNkODcwYTE0YTQyMDcwNGFiMGIwYjc4MmZmMjljZGE1ZmEw";

// Komponen ini sekarang menggunakan SDK resmi EulerStream
export default function LiveTestPage() {
    const { data } = useContext(AppContext) as AppContextType;
    const [selectedUsername, setSelectedUsername] = useState<string>('');
    const [connectionStatus, setConnectionStatus] = useState('Menunggu untuk memulai...');
    const [chatLog, setChatLog] = useState<string[]>([]);
    
    const [usernameToConnect, setUsernameToConnect] = useState<string | null>(null);
    // Ref sekarang akan menyimpan instance dari EulerAPI
    const api = useRef<EulerAPI | null>(null);

    // useEffect ini mengelola seluruh siklus hidup koneksi menggunakan SDK
    useEffect(() => {
        if (!usernameToConnect) {
            return;
        }

        // Buat instance baru dari SDK dengan kunci API Anda
        const eulerApi = new EulerAPI(EULER_STREAM_API_KEY);
        api.current = eulerApi;

        setChatLog([]);
        setConnectionStatus(`Menghubungkan ke EulerStream untuk @${usernameToConnect}...`);

        // --- Menggunakan event handler dari SDK ---

        eulerApi.on('open', () => {
            console.log('[SDK] WebSocket terhubung dan terotorisasi.');
            setConnectionStatus(`Otorisasi berhasil. Berlangganan ke @${usernameToConnect}...`);
            // Setelah terhubung dan terotorisasi, langsung subscribe
            eulerApi.subscribe(usernameToConnect);
        });

        eulerApi.on('subscribed', (username) => {
            console.log(`[SDK] Berhasil berlangganan ke ${username}`);
            setConnectionStatus(`Berhasil memantau @${username}. Menunggu data...`);
        });

        eulerApi.on('event', (event) => {
            // Menangani semua event dari TikTok (chat, gift, dll.)
            switch (event.type) {
                case 'chat':
                    const chatText = `${event.data.user.uniqueId}: ${event.data.comment}`;
                    setChatLog(prev => [chatText, ...prev].slice(0, 100));
                    break;
                case 'gift':
                    const gift = event.data.gift;
                    if (gift && gift.gift_name) {
                        const giftText = `🎁 ${event.data.user.uniqueId} mengirim ${gift.gift_name} x${gift.repeat_count}`;
                        setChatLog(prev => [giftText, ...prev].slice(0, 100));
                    }
                    break;
                case 'disconnected':
                    setConnectionStatus(`Siaran langsung untuk @${usernameToConnect} telah berakhir.`);
                    break;
            }
        });

        eulerApi.on('close', (event) => {
            console.log(`[SDK] Koneksi ditutup. Kode: ${event.code}, Alasan: ${event.reason}`);
            setConnectionStatus('Koneksi ditutup. Silakan coba lagi.');
        });

        eulerApi.on('error', (error) => {
            console.error('[SDK] Error:', error);
            setConnectionStatus(`Terjadi eror: ${error.message}`);
        });

        // Memulai koneksi
        eulerApi.connect();

        // Fungsi pembersihan untuk efek ini
        return () => {
            console.log(`[SDK] Membersihkan koneksi untuk @${usernameToConnect}`);
            eulerApi.disconnect();
        };
    }, [usernameToConnect]); // Jalankan ulang efek ini setiap kali usernameToConnect berubah

    const handleTestConnection = () => {
        if (!selectedUsername) {
            setConnectionStatus('Silakan pilih username terlebih dahulu.');
            return;
        }
        // Memicu useEffect dengan mengatur state
        setUsernameToConnect(selectedUsername);
    };

    return (
        <section>
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100">Uji Coba Koneksi TikTok LIVE</h2>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Pilih satu akun yang sedang live untuk menguji koneksi.</p>
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
                        className="w-full sm:w-auto unity-gradient-bg text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:opacity-90 flex items-center justify-center"
                    >
                        Mulai Pantau Live
                    </button>
                </div>

                <div className="mt-6">
                    <h3 className="text-lg font-medium">Status Koneksi:</h3>
                    <pre className="mt-2 p-4 bg-stone-100 dark:bg-stone-900 rounded-md text-sm whitespace-pre-wrap break-all">{connectionStatus}</pre>
                </div>

                <div className="mt-6">
                    <h3 className="text-lg font-medium">Log Chat & Hadiah (Real-time):</h3>
                    <div className="mt-2 p-4 h-64 overflow-y-auto bg-stone-100 dark:bg-stone-900 rounded-md text-sm space-y-2">
                        {chatLog.length === 0 && <p className="text-stone-400">Menunggu data chat dan hadiah...</p>}
                        {chatLog.map((msg, i) => <p key={i}>{msg}</p>)}
                    </div>
                </div>
            </div>
        </section>
    );
}

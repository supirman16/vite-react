import { useContext, useState, useEffect, useRef } from 'react';
import { AppContext, AppContextType } from '../App';

// Pastikan Anda menggunakan URL Railway Anda di sini
const WEBSOCKET_URL = "wss://vite-react-production-4165.up.railway.app"; 

export default function LiveTestPage() {
    const { data } = useContext(AppContext) as AppContextType;
    const [selectedUsername, setSelectedUsername] = useState<string>('');
    const [connectionStatus, setConnectionStatus] = useState('Menunggu untuk memulai...');
    const [chatLog, setChatLog] = useState<string[]>([]);
    
    // Menggunakan objek dengan timestamp untuk memastikan referensi baru dibuat setiap kali,
    // yang akan memicu useEffect dengan andal.
    const [connectTrigger, setConnectTrigger] = useState<{ timestamp: number } | null>(null);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        // Jangan lakukan apa pun jika tidak ada pemicu
        if (!connectTrigger) {
            return;
        }

        setChatLog([]);
        setConnectionStatus(`Menghubungkan ke server echo...`);

        const newWs = new WebSocket(WEBSOCKET_URL);
        ws.current = newWs;

        console.log(`[Frontend] Dibuat (readyState: ${newWs.readyState})`);

        newWs.onopen = () => {
            console.log(`[Frontend] Terbuka (readyState: ${newWs.readyState})`);
            setConnectionStatus('Terhubung! Mengirim pesan tes...');
            newWs.send("Halo server, ini tes dari frontend!");
        };

        newWs.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log('[Frontend] Menerima pesan:', message);
            setConnectionStatus(message.message);
            setChatLog(prev => [message.message, ...prev]);
        };

        newWs.onclose = (event) => {
            console.log(`[Frontend] Ditutup (readyState: ${newWs.readyState}). Kode: ${event.code}`);
            // Hanya perbarui status jika ini bukan penutupan yang disengaja oleh efek baru
            if (connectTrigger.timestamp === (connectTrigger?.timestamp || 0)) {
                setConnectionStatus('Koneksi ke server backend ditutup.');
            }
        };

        newWs.onerror = () => {
            console.log(`[Frontend] Eror (readyState: ${newWs.readyState})`);
            setConnectionStatus('Gagal terhubung ke server backend. Periksa log Railway.');
        };

        // Ini adalah fungsi pembersihan untuk efek.
        // Ia akan berjalan saat komponen dilepas, ATAU saat efek berjalan kembali.
        return () => {
            console.log(`[Frontend] Membersihkan koneksi (readyState: ${newWs.readyState})`);
            // Kita hapus event handler untuk mencegahnya berjalan pada soket yang sudah ditutup.
            newWs.onopen = null;
            newWs.onmessage = null;
            newWs.onerror = null;
            newWs.onclose = null;
            newWs.close();
        };
    }, [connectTrigger]); // Efek ini hanya berjalan kembali saat pemicu berubah.

    const handleTestConnection = () => {
        if (!selectedUsername) {
            setConnectionStatus('Silakan pilih username terlebih dahulu.');
            return;
        }
        // Memicu useEffect dengan mengatur state baru.
        setConnectTrigger({ timestamp: Date.now() });
    };

    return (
        <section>
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100">Uji Coba Koneksi Server</h2>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Tes ini hanya untuk memeriksa koneksi WebSocket dasar ke server Railway.</p>
            </div>

            <div className="bg-white dark:bg-stone-800 p-6 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                     <select 
                        value={selectedUsername} 
                        onChange={(e) => setSelectedUsername(e.target.value)}
                        className="bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 dark:bg-stone-700 dark:border-stone-600"
                    >
                        <option value="">Pilih Akun TikTok (hanya untuk tes)</option>
                        {data.tiktokAccounts.filter(acc => acc.status === 'Aktif').map(acc => (
                            <option key={acc.id} value={acc.username}>{acc.username}</option>
                        ))}
                    </select>
                    <button 
                        onClick={handleTestConnection} 
                        className="w-full sm:w-auto unity-gradient-bg text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:opacity-90 flex items-center justify-center"
                    >
                        Tes Koneksi
                    </button>
                </div>

                <div className="mt-6">
                    <h3 className="text-lg font-medium">Status Koneksi:</h3>
                    <pre className="mt-2 p-4 bg-stone-100 dark:bg-stone-900 rounded-md text-sm whitespace-pre-wrap break-all">{connectionStatus}</pre>
                </div>

                <div className="mt-6">
                    <h3 className="text-lg font-medium">Log Server:</h3>
                    <div className="mt-2 p-4 h-64 overflow-y-auto bg-stone-100 dark:bg-stone-900 rounded-md text-sm space-y-2">
                        {chatLog.length === 0 && <p className="text-stone-400">Menunggu respons dari server...</p>}
                        {chatLog.map((msg, i) => <p key={i}>{msg}</p>)}
                    </div>
                </div>
            </div>
        </section>
    );
}

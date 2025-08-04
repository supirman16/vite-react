import { useContext, useState, useEffect, useRef } from 'react';
import { AppContext, AppContextType } from '../App';

// Pastikan Anda menggunakan URL Railway Anda di sini
const WEBSOCKET_URL = "wss://vite-react-production-4165.up.railway.app"; 

export default function LiveTestPage() {
    const { data } = useContext(AppContext) as AppContextType;
    const [selectedUsername, setSelectedUsername] = useState<string>('');
    const [connectionStatus, setConnectionStatus] = useState('Menunggu untuk memulai...');
    const [chatLog, setChatLog] = useState<string[]>([]);
    
    const [shouldConnect, setShouldConnect] = useState(false);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!shouldConnect) {
            return;
        }

        if (ws.current) {
            ws.current.close();
        }

        setChatLog([]);
        setConnectionStatus(`Menghubungkan ke server echo...`);

        const newWs = new WebSocket(WEBSOCKET_URL);

        newWs.onopen = () => {
            console.log('[Frontend] Terhubung ke server backend.');
            setConnectionStatus('Terhubung! Mengirim pesan tes...');
            // Kirim pesan tes sederhana
            newWs.send("Halo server, ini tes dari frontend!");
        };

        newWs.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log('[Frontend] Menerima pesan:', message);
            // Tampilkan status atau pesan echo dari server
            setConnectionStatus(message.message);
            setChatLog(prev => [message.message, ...prev]);
        };

        newWs.onclose = () => {
            setConnectionStatus('Koneksi ke server backend ditutup.');
        };

        newWs.onerror = () => {
            setConnectionStatus('Gagal terhubung ke server backend. Periksa log Railway.');
        };

        ws.current = newWs;
        // Reset pemicu setelah koneksi dibuat
        setShouldConnect(false);

        return () => {
            newWs.close();
        };
    }, [shouldConnect]);

    const handleTestConnection = () => {
        if (!selectedUsername) {
            setConnectionStatus('Silakan pilih username terlebih dahulu.');
            return;
        }
        // Memicu useEffect
        setShouldConnect(true);
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

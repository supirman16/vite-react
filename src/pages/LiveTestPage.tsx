import { useContext, useState, useEffect, useRef } from 'react';
import { AppContext, AppContextType } from '../App';

// Komponen ini adalah halaman khusus untuk menguji koneksi ke TikTok LIVE melalui WebSocket.
export default function LiveTestPage() {
    const { data } = useContext(AppContext) as AppContextType;
    const [selectedUsername, setSelectedUsername] = useState<string>('');
    const [connectionStatus, setConnectionStatus] = useState('Menunggu untuk memulai...');
    const [chatLog, setChatLog] = useState<string[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const ws = useRef<WebSocket | null>(null);

    // Efek ini akan membuat dan membersihkan koneksi WebSocket
    useEffect(() => {
        // GANTI URL DI BAWAH INI DENGAN URL DARI RENDER
        const websocketUrl = 'wss://nama-server-anda.onrender.com'; // <-- PERHATIKAN INI
        
        ws.current = new WebSocket(websocketUrl);

        ws.current.onopen = () => {
            console.log('WebSocket terhubung ke server.');
            setConnectionStatus('Siap untuk menguji koneksi. Pilih akun dan klik tombol.');
        };

        ws.current.onclose = () => {
            console.log('WebSocket terputus dari server.');
            setConnectionStatus('Koneksi ke server terputus. Silakan segarkan halaman.');
            setIsConnected(false);
        };

        ws.current.onmessage = (event) => {
            const message = JSON.parse(event.data);

            switch (message.type) {
                case 'status':
                case 'connected':
                case 'disconnected':
                    setConnectionStatus(message.message);
                    if(message.type === 'connected') setIsConnected(true);
                    if(message.type === 'disconnected') setIsConnected(false);
                    break;
                case 'chat':
                    const chatText = `${message.data.uniqueId}: ${message.data.comment}`;
                    setChatLog(prev => [chatText, ...prev].slice(0, 100));
                    break;
                case 'gift':
                    const giftText = `🎁 ${message.data.uniqueId} mengirim ${message.data.giftName} x${message.data.repeatCount}`;
                    setChatLog(prev => [giftText, ...prev].slice(0, 100));
                    break;
                case 'error':
                     setConnectionStatus(`Error dari server: ${message.message}`);
                     break;
            }
        };

        // Fungsi pembersihan saat komponen dilepas
        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, []); // Array dependensi kosong berarti efek ini hanya berjalan sekali

    const handleTestConnection = () => {
        if (!selectedUsername) {
            setConnectionStatus('Silakan pilih username terlebih dahulu.');
            return;
        }

        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            setChatLog([]); // Kosongkan log saat memulai koneksi baru
            const message = {
                action: 'connect',
                username: selectedUsername
            };
            ws.current.send(JSON.stringify(message));
        } else {
            setConnectionStatus('Koneksi WebSocket belum siap. Coba lagi sebentar.');
        }
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
                        className="w-full sm:w-auto unity-gradient-bg text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:opacity-90 flex items-center justify-center disabled:opacity-75"
                    >
                        Test Koneksi
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

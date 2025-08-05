import { useContext, useState, useEffect, useRef } from 'react';
import { AppContext, AppContextType } from '../App';
import { Users, Heart, Share2, UserPlus } from 'lucide-react';

// --- Pastikan Anda menggunakan URL Heroku Anda di sini ---
const WEBSOCKET_URL = "wss://unity-host-dashboard-bfc030a0ba69.herokuapp.com/"; 

export default function LiveTestPage() {
    const { data } = useContext(AppContext) as AppContextType;
    const [selectedUsername, setSelectedUsername] = useState<string>('');
    const [connectionStatus, setConnectionStatus] = useState('Menunggu untuk memulai...');
    const [chatLog, setChatLog] = useState<string[]>([]);
    
    // State baru untuk statistik
    const [roomStats, setRoomStats] = useState({ viewerCount: 0, likeCount: 0 });
    
    const [usernameToConnect, setUsernameToConnect] = useState<string | null>(null);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!usernameToConnect) {
            return;
        }

        if (ws.current) {
            ws.current.close();
        }

        setChatLog([]);
        // Reset statistik saat koneksi baru
        setRoomStats({ viewerCount: 0, likeCount: 0 });
        setConnectionStatus(`Menghubungkan ke server backend untuk @${usernameToConnect}...`);

        const newWs = new WebSocket(WEBSOCKET_URL);

        newWs.onopen = () => {
            console.log('[Frontend] Terhubung ke server backend.');
            newWs.send(JSON.stringify({
                action: "connect",
                username: usernameToConnect,
            }));
        };

        newWs.onmessage = (event) => {
            const message = JSON.parse(event.data);
            switch (message.type) {
                case 'status':
                case 'connected':
                case 'disconnected':
                case 'error':
                    setConnectionStatus(message.message);
                    break;
                case 'chat':
                    // --- PERBAIKAN: Menggunakan properti yang benar ---
                    const chatText = `${message.data.user.uniqueId}: ${message.data.comment}`;
                    setChatLog(prev => [chatText, ...prev].slice(0, 100));
                    break;
                case 'gift':
                     // --- PERBAIKAN: Menggunakan properti yang benar ---
                    const giftText = `🎁 ${message.data.user.uniqueId} mengirim ${message.data.giftName} x${message.data.repeatCount}`;
                    setChatLog(prev => [giftText, ...prev].slice(0, 100));
                    break;
                case 'stats':
                    setRoomStats(prev => ({
                        viewerCount: message.data.viewerCount ?? prev.viewerCount,
                        likeCount: message.data.likeCount ?? prev.likeCount,
                    }));
                    break;
                case 'social':
                    const socialText = `✨ ${message.data.label}`;
                    setChatLog(prev => [socialText, ...prev].slice(0, 100));
                    break;
            }
        };

        newWs.onclose = () => {
            setConnectionStatus('Koneksi ke server backend ditutup.');
        };

        newWs.onerror = () => {
            setConnectionStatus('Gagal terhubung ke server backend. Pastikan server sudah berjalan.');
        };

        ws.current = newWs;

        return () => {
            newWs.close();
        };
    }, [usernameToConnect]);

    const handleTestConnection = () => {
        if (!selectedUsername) {
            setConnectionStatus('Silakan pilih username terlebih dahulu.');
            return;
        }
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
                
                {/* --- PANEL STATISTIK BARU --- */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-stone-100 dark:bg-stone-900 p-4 rounded-lg flex items-center">
                        <Users className="h-6 w-6 text-purple-500 mr-4" />
                        <div>
                            <p className="text-sm text-stone-500 dark:text-stone-400">Penonton</p>
                            <p className="text-2xl font-bold">{roomStats.viewerCount.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="bg-stone-100 dark:bg-stone-900 p-4 rounded-lg flex items-center">
                        <Heart className="h-6 w-6 text-red-500 mr-4" />
                        <div>
                            <p className="text-sm text-stone-500 dark:text-stone-400">Suka</p>
                            <p className="text-2xl font-bold">{roomStats.likeCount.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                {/* ----------------------------- */}

                <div className="mt-6">
                    <h3 className="text-lg font-medium">Status Koneksi:</h3>
                    <pre className="mt-2 p-4 bg-stone-100 dark:bg-stone-900 rounded-md text-sm whitespace-pre-wrap break-all">{connectionStatus}</pre>
                </div>

                <div className="mt-6">
                    <h3 className="text-lg font-medium">Log Event (Chat, Gift, Follow, dll.):</h3>
                    <div className="mt-2 p-4 h-64 overflow-y-auto bg-stone-100 dark:bg-stone-900 rounded-md text-sm space-y-2">
                        {chatLog.length === 0 && <p className="text-stone-400">Menunggu data...</p>}
                        {chatLog.map((msg, i) => <p key={i}>{msg}</p>)}
                    </div>
                </div>
            </div>
        </section>
    );
}

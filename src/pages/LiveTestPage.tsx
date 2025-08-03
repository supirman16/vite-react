import { useContext, useState, useEffect, useRef } from 'react';
import { AppContext, AppContextType } from '../App';

// Kunci API EulerStream Anda
const EULER_STREAM_API_KEY = "ZTlhMTg4YzcyMTRhNWY1ZTk2ZTNkODcwYTE0YTQyMDcwNGFiMGIwYjc4MmZmMjljZGE1ZmEw";
const EULER_STREAM_WEBSOCKET_URL = "wss://tiktok.eulerstream.com/ws";

// Komponen ini sekarang akan terhubung langsung ke WebSocket Proxy EulerStream
export default function LiveTestPage() {
    const { data } = useContext(AppContext) as AppContextType;
    const [selectedUsername, setSelectedUsername] = useState<string>('');
    const [connectionStatus, setConnectionStatus] = useState('Menunggu untuk memulai...');
    const [chatLog, setChatLog] = useState<string[]>([]);
    const ws = useRef<WebSocket | null>(null);
    const currentUsername = useRef<string | null>(null);

    // Efek untuk membersihkan koneksi saat komponen dilepas
    useEffect(() => {
        return () => {
            if (ws.current) {
                console.log("Menutup koneksi WebSocket saat komponen dilepas...");
                ws.current.close();
            }
        };
    }, []);

    const handleTestConnection = () => {
        if (!selectedUsername) {
            setConnectionStatus('Silakan pilih username terlebih dahulu.');
            return;
        }

        // Tutup koneksi lama jika ada
        if (ws.current) {
            console.log("Menutup koneksi WebSocket yang ada untuk memulai yang baru...");
            ws.current.close();
        }

        setChatLog([]);
        currentUsername.current = selectedUsername;
        setConnectionStatus(`Mencoba terhubung ke EulerStream untuk @${selectedUsername}...`);

        // Buat instance WebSocket baru
        ws.current = new WebSocket(EULER_STREAM_WEBSOCKET_URL);

        // --- PERUBAHAN LOGIKA UTAMA DIMULAI DI SINI ---

        ws.current.onopen = () => {
            console.log('WebSocket terhubung ke EulerStream.');
            setConnectionStatus('Terhubung ke server. Mengautentikasi...');
            // Langsung kirim pesan otorisasi setelah terhubung
            ws.current?.send(JSON.stringify({
                action: "authorize",
                data: EULER_STREAM_API_KEY,
            }));
        };

        ws.current.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.action === "authorized") {
                console.log("Otorisasi berhasil. Mengirim permintaan subscribe...");
                setConnectionStatus(`Otorisasi berhasil. Meminta data untuk @${selectedUsername}...`);
                // Setelah otorisasi berhasil, langsung kirim pesan subscribe
                ws.current?.send(JSON.stringify({
                    action: "subscribe",
                    data: {
                        username: selectedUsername
                    }
                }));
            } else if (message.action === "subscribed") {
                console.log(`Berhasil subscribe ke ${message.data.username}`);
                setConnectionStatus(`Berhasil memantau @${message.data.username}. Menunggu data...`);
            } else if (message.event) {
                // Menangani event dari TikTok
                switch (message.event.type) {
                    case 'chat':
                        const chatText = `${message.event.data.user.uniqueId}: ${message.event.data.comment}`;
                        setChatLog(prev => [chatText, ...prev].slice(0, 100));
                        break;
                    case 'gift':
                        const gift = message.event.data.gift;
                        if (gift && gift.gift_name) {
                            const giftText = `🎁 ${message.event.data.user.uniqueId} mengirim ${gift.gift_name} x${gift.repeat_count}`;
                            setChatLog(prev => [giftText, ...prev].slice(0, 100));
                        }
                        break;
                    case 'disconnected':
                        setConnectionStatus(`Siaran langsung untuk @${currentUsername.current} telah berakhir.`);
                        break;
                }
            } else if (message.error) {
                console.error("Error dari EulerStream:", message.error);
                setConnectionStatus(`Error: ${message.error}`);
            }
        };

        ws.current.onclose = () => {
            console.log('WebSocket terputus dari EulerStream.');
            setConnectionStatus('Koneksi terputus. Silakan coba lagi.');
        };

        ws.current.onerror = (error) => {
            console.error('WebSocket Error:', error);
            setConnectionStatus('Terjadi eror pada koneksi WebSocket. Periksa konsol untuk detail.');
        };
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

import { useContext, useState } from 'react';
import { AppContext, AppContextType } from '../App';
import { TikTokLiveConnection } from 'tiktok-live-connector';

// Komponen ini adalah halaman khusus untuk menguji koneksi ke TikTok LIVE.
export default function LiveTestPage() {
    const { data } = useContext(AppContext) as AppContextType;
    const [selectedUsername, setSelectedUsername] = useState<string>('');
    const [connectionStatus, setConnectionStatus] = useState('Menunggu untuk memulai...');
    const [chatLog, setChatLog] = useState<string[]>([]);
    const [isConnecting, setIsConnecting] = useState(false);

    const handleTestConnection = () => {
        if (!selectedUsername) {
            setConnectionStatus('Silakan pilih username terlebih dahulu.');
            return;
        }

        setIsConnecting(true);
        setConnectionStatus(`Mencoba terhubung ke @${selectedUsername}...`);
        setChatLog([]);

        try {
            const connection = new TikTokLiveConnection(selectedUsername);

            connection.connect().then(state => {
                setConnectionStatus(`BERHASIL terhubung ke Room ID: ${state.roomId}`);
                setIsConnecting(false);

                connection.on('chat', data => {
                    const message = `${data.uniqueId}: ${data.comment}`;
                    setChatLog(prev => [message, ...prev].slice(0, 100)); // Simpan 100 pesan terakhir
                });

                connection.on('gift', data => {
                    const message = `🎁 ${data.uniqueId} mengirim ${data.gift.gift_name} x${data.gift.repeat_count}`;
                    setChatLog(prev => [message, ...prev].slice(0, 100));
                });
                
                connection.on('disconnected', () => {
                    setConnectionStatus('Koneksi terputus.');
                });

            }).catch(err => {
                setConnectionStatus(`GAGAL terhubung: ${err.message || err.toString()}`);
                setIsConnecting(false);
            });

        } catch (err: any) {
            setConnectionStatus(`Error saat inisiasi: ${err.message}`);
            setIsConnecting(false);
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
                        disabled={isConnecting}
                        className="w-full sm:w-auto unity-gradient-bg text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:opacity-90 flex items-center justify-center disabled:opacity-75"
                    >
                        {isConnecting ? 'Menghubungkan...' : 'Test Koneksi'}
                    </button>
                </div>

                <div className="mt-6">
                    <h3 className="text-lg font-medium">Status Koneksi:</h3>
                    <pre className="mt-2 p-4 bg-stone-100 dark:bg-stone-900 rounded-md text-sm whitespace-pre-wrap break-all">{connectionStatus}</pre>
                </div>

                <div className="mt-6">
                    <h3 className="text-lg font-medium">Log Chat & Hadiah (Real-time):</h3>
                    <div className="mt-2 p-4 h-64 overflow-y-auto bg-stone-100 dark:bg-stone-900 rounded-md text-sm space-y-2">
                        {chatLog.map((msg, i) => <p key={i}>{msg}</p>)}
                    </div>
                </div>
            </div>
        </section>
    );
}

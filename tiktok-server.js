// tiktok-server.js

// --- 1. Impor Dependensi ---
import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import { TikTokLiveConnection, WebcastEvent } from 'tiktok-live-connector';

// --- 2. Konfigurasi Server ---
const PORT = process.env.PORT || 8080;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// === TAMBAHAN: Health Check Endpoint ===
// Rute ini akan merespons permintaan HTTP dari Railway untuk memastikan server tetap berjalan.
app.get('/', (req, res) => {
  res.send('TikTok WebSocket Server is running.');
});
// ======================================

// Objek untuk menyimpan koneksi TikTok yang aktif untuk setiap klien WebSocket
const activeConnections = new Map();

// --- 3. Logika WebSocket Server ---
wss.on('connection', (ws) => {
    console.log('Klien baru terhubung ke WebSocket server.');

    // Saat menerima pesan dari klien
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);

            // Periksa apakah ada koneksi lama untuk klien ini dan putuskan
            if (activeConnections.has(ws)) {
                console.log('Memutuskan koneksi TikTok lama...');
                activeConnections.get(ws).disconnect();
                activeConnections.delete(ws);
            }

            // Hanya proses jika aksinya adalah 'connect'
            if (data.action === 'connect' && data.username) {
                const { username } = data;
                console.log(`Menerima permintaan untuk terhubung ke @${username}`);

                // Kirim status 'menghubungkan' kembali ke klien
                ws.send(JSON.stringify({ type: 'status', message: `Menghubungkan ke @${username}...` }));

                // Buat koneksi baru ke TikTok
                const tiktokConnection = new TikTokLiveConnection(username);
                activeConnections.set(ws, tiktokConnection); // Simpan koneksi

                // Tangani event dari TikTok dan teruskan ke klien
                setupEventHandlers(tiktokConnection, ws, username);

                // Coba terhubung
                await tiktokConnection.connect();

            }
        } catch (error) {
            console.error('Pesan tidak valid atau eror:', error);
            ws.send(JSON.stringify({ type: 'error', message: 'Pesan tidak valid dari klien.' }));
        }
    });

    // Saat koneksi klien ditutup
    ws.on('close', () => {
        console.log('Klien terputus.');
        // Putuskan juga koneksi TikTok yang terkait
        if (activeConnections.has(ws)) {
            activeConnections.get(ws).disconnect();
            activeConnections.delete(ws);
        }
    });
});

// --- 4. Fungsi Bantuan untuk Event Handler ---
function setupEventHandlers(tiktokConnection, ws, username) {
    // Berhasil terhubung
    tiktokConnection.on('connected', (state) => {
        console.log(`Berhasil terhubung ke Room ID ${state.roomId}`);
        ws.send(JSON.stringify({ type: 'connected', message: `BERHASIL terhubung ke @${username} (Room ID: ${state.roomId})` }));
    });

    // Gagal terhubung
    tiktokConnection.on('disconnected', () => {
        console.log('Koneksi TikTok terputus.');
        ws.send(JSON.stringify({ type: 'disconnected', message: 'Koneksi ke TikTok terputus.' }));
    });

    // Menerima chat
    tiktokConnection.on(WebcastEvent.CHAT, (data) => {
        const chatMessage = {
            type: 'chat',
            data: {
                uniqueId: data.uniqueId,
                comment: data.comment
            }
        };
        ws.send(JSON.stringify(chatMessage));
    });

    // Menerima gift
    tiktokConnection.on(WebcastEvent.GIFT, (data) => {
        // Hanya proses jika nama gift ada
        if (data.gift && data.gift.gift_name) {
            const giftMessage = {
                type: 'gift',
                data: {
                    uniqueId: data.uniqueId,
                    giftName: data.gift.gift_name,
                    repeatCount: data.gift.repeat_count
                }
            };
            ws.send(JSON.stringify(giftMessage));
        }
    });
}


// --- 5. Jalankan Server ---
server.listen(PORT, () => {
    console.log(`WebSocket server berjalan di http://localhost:${PORT}`);
});

// tiktok-server.js

import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import { TikTokLiveConnection, WebcastEvent } from 'tiktok-live-connector';
import cors from 'cors'; // Import CORS

// Penjaga Eror Fatal untuk stabilitas
process.on('uncaughtException', (error, origin) => {
    console.error(`[FATAL] Uncaught Exception. Origin: ${origin}`, error);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('[FATAL] Unhandled Rejection. Reason:', reason, 'at Promise:', promise);
});

// Konfigurasi Server
const PORT = process.env.PORT || 8080;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// --- PERUBAHAN UTAMA: Tambahkan CORS ---
// Ini penting agar Vercel bisa memanggil API Heroku Anda
app.use(cors());
// ------------------------------------

// Kunci API EulerStream Anda
const EULER_STREAM_API_KEY = "ZTlhMTg4YzcyMTRhNWY1ZTk2ZTNkODcwYTE0YTQyMDcwNGFiMGIwYjc4MmZmMjljZGE1ZmEw";

// Endpoint untuk Health Check
app.get('/', (req, res) => {
  res.status(200).send('TikTok WebSocket Server is running.');
});

// --- API ENDPOINT BARU UNTUK MEMERIKSA STATUS LIVE ---
app.get('/check-status/:username', async (req, res) => {
    const { username } = req.params;
    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    console.log(`[API] Memeriksa status untuk @${username}`);
    try {
        const tiktokConnection = new TikTokLiveConnection(username, {
            signWebcastRequest: async (url, headers) => {
                const signResponse = await fetch('https://tiktok.eulerstream.com/api/v1/webcast/sign_url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-API-Key': EULER_STREAM_API_KEY },
                    body: JSON.stringify({ url }),
                });
                const signedData = await signResponse.json();
                if (signedData.error) throw new Error(signedData.error);
                return { ...signedData, "User-Agent": headers['User-Agent'] };
            }
        });

        await tiktokConnection.connect();
        tiktokConnection.disconnect();
        console.log(`[API] @${username} sedang live.`);
        res.status(200).json({ isLive: true });
    } catch (err) {
        console.log(`[API] @${username} tidak live atau terjadi eror.`);
        res.status(200).json({ isLive: false });
    }
});
// ----------------------------------------------------

// Logika WebSocket Server (Tidak berubah)
const activeConnections = new Map();
wss.on('connection', (ws) => {
    console.log('[Server] Klien baru terhubung.');
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            if (activeConnections.has(ws)) { activeConnections.get(ws).disconnect(); }
            if (data.action === 'connect' && data.username) {
                const { username } = data;
                ws.send(JSON.stringify({ type: 'status', message: `Menghubungkan ke @${username}...` }));
                const tiktokConnection = new TikTokLiveConnection(username, {
                     signWebcastRequest: async (url, headers) => {
                        const signResponse = await fetch('https://tiktok.eulerstream.com/api/v1/webcast/sign_url', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'X-API-Key': EULER_STREAM_API_KEY },
                            body: JSON.stringify({ url }),
                        });
                        const signedData = await signResponse.json();
                        if (signedData.error) throw new Error(signedData.error);
                        return { ...signedData, "User-Agent": headers['User-Agent'] };
                    }
                });
                activeConnections.set(ws, tiktokConnection);
                setupEventHandlers(tiktokConnection, ws, username);
                await tiktokConnection.connect();
            }
        } catch (error) {
            ws.send(JSON.stringify({ type: 'error', message: `Gagal memproses permintaan: ${error.message}` }));
        }
    });
    ws.on('close', () => {
        if (activeConnections.has(ws)) {
            activeConnections.get(ws).disconnect();
            activeConnections.delete(ws);
        }
    });
});
function setupEventHandlers(tiktokConnection, ws, username) {
    tiktokConnection.on('connected', (state) => ws.send(JSON.stringify({ type: 'connected', message: `BERHASIL terhubung ke @${username} (Room ID: ${state.roomId})` })));
    tiktokConnection.on('disconnected', () => ws.send(JSON.stringify({ type: 'disconnected', message: 'Koneksi ke TikTok terputus.' })));
    tiktokConnection.on(WebcastEvent.CHAT, (data) => ws.send(JSON.stringify({ type: 'chat', data: { uniqueId: data.uniqueId, comment: data.comment } })));
    tiktokConnection.on(WebcastEvent.GIFT, (data) => { if (data.gift && data.gift.gift_name) { ws.send(JSON.stringify({ type: 'gift', data: { uniqueId: data.uniqueId, giftName: data.gift.gift_name, repeatCount: data.gift.repeat_count } })); }});
    tiktokConnection.on('error', (error) => ws.send(JSON.stringify({ type: 'error', message: `Terjadi eror: ${error.message}` })));
}

server.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});

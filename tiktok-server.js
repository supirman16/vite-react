// tiktok-server.js

import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import { TikTokLiveConnection, WebcastEvent } from 'tiktok-live-connector';

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

// Kunci API EulerStream Anda
const EULER_STREAM_API_KEY = "ZTlhMTg4YzcyMTRhNWY1ZTk2ZTNkODcwYTE0YTQyMDcwNGFiMGIwYjc4MmZmMjljZGE1ZmEw";

// Endpoint untuk Health Check (penting untuk deployment)
app.get('/', (req, res) => {
  res.status(200).send('TikTok WebSocket Server is running.');
});

const activeConnections = new Map();

// Logika WebSocket Server
wss.on('connection', (ws) => {
    console.log('[Server] Klien baru terhubung.');

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);

            if (activeConnections.has(ws)) {
                activeConnections.get(ws).disconnect();
            }

            if (data.action === 'connect' && data.username) {
                const { username } = data;
                ws.send(JSON.stringify({ type: 'status', message: `Menghubungkan ke @${username}...` }));

                // Menggunakan tiktok-live-connector dengan EulerStream sebagai signing server
                const tiktokConnection = new TikTokLiveConnection(username, {
                    signWebcastRequest: async (url, headers) => {
                        const signResponse = await fetch('https://tiktok.eulerstream.com/api/v1/webcast/sign_url', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-API-Key': EULER_STREAM_API_KEY,
                            },
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
            console.error('[Server] Eror memproses pesan:', error);
            ws.send(JSON.stringify({ type: 'error', message: `Gagal memproses permintaan: ${error.message}` }));
        }
    });

    ws.on('close', () => {
        console.log('[Server] Klien terputus.');
        if (activeConnections.has(ws)) {
            activeConnections.get(ws).disconnect();
            activeConnections.delete(ws);
        }
    });
});

function setupEventHandlers(tiktokConnection, ws, username) {
    tiktokConnection.on('connected', (state) => {
        ws.send(JSON.stringify({ type: 'connected', message: `BERHASIL terhubung ke @${username} (Room ID: ${state.roomId})` }));
    });
    tiktokConnection.on('disconnected', () => {
        ws.send(JSON.stringify({ type: 'disconnected', message: 'Koneksi ke TikTok terputus.' }));
    });
    tiktokConnection.on(WebcastEvent.CHAT, (data) => {
        ws.send(JSON.stringify({ type: 'chat', data: { uniqueId: data.uniqueId, comment: data.comment } }));
    });
    tiktokConnection.on(WebcastEvent.GIFT, (data) => {
        if (data.gift && data.gift.gift_name) {
            ws.send(JSON.stringify({ type: 'gift', data: { uniqueId: data.uniqueId, giftName: data.gift.gift_name, repeatCount: data.gift.repeat_count } }));
        }
    });
    tiktokConnection.on('error', (error) => {
        ws.send(JSON.stringify({ type: 'error', message: `Terjadi eror: ${error.message}` }));
    });
}

server.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});

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

                const tiktokConnection = new TikTokLiveConnection(username);
                activeConnections.set(ws, tiktokConnection);
                setupEventHandlers(tiktokConnection, ws, username);
                
                await tiktokConnection.connect();
            }
        } catch (error) {
            console.error('[Server] Eror memproses pesan:', error);
            ws.send(JSON.stringify({ type: 'error', message: 'Pesan dari klien tidak valid.' }));
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

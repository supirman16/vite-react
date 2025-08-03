// tiktok-server.js

// --- 1. Impor Dependensi ---
import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import { TikTokLiveConnection, WebcastEvent } from 'tiktok-live-connector';

// Penjaga Eror Fatal
process.on('uncaughtException', (error, origin) => {
    console.error(`[Server Log] FATAL (uncaughtException): Origin: ${origin}`, error);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('[Server Log] FATAL (unhandledRejection): Reason:', reason, 'at Promise:', promise);
});

// --- 2. Konfigurasi Server & Kunci API ---
const PORT = process.env.PORT || 8080;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Kunci API EulerStream dari kode Anda yang sudah ada
const EULER_STREAM_API_KEY = "ZTlhMTg4YzcyMTRhNWY1ZTk2ZTNkODcwYTE0YTQyMDcwNGFiMGIwYjc4MmZmMjljZGE1ZmEw";

// Health Check Endpoint
app.get('/', (req, res) => {
  res.status(200).send('TikTok WebSocket Server is running and healthy.');
});

const activeConnections = new Map();

// --- 3. Logika WebSocket Server ---
wss.on('connection', (ws) => {
    console.log('[Server Log] New client connected to WebSocket server.');

    ws.on('message', async (message) => {
        console.log(`[Server Log] Received message: ${message}`);
        try {
            const data = JSON.parse(message);

            if (activeConnections.has(ws)) {
                activeConnections.get(ws).disconnect();
            }

            if (data.action === 'connect' && data.username) {
                const { username } = data;
                ws.send(JSON.stringify({ type: 'status', message: `Connecting to @${username}...` }));

                try {
                    // === PERUBAHAN UTAMA: Menggunakan Konfigurasi Signing EulerStream ===
                    console.log(`[Server Log] Creating TikTok connection for @${username} with EulerStream signing.`);
                    const tiktokConnection = new TikTokLiveConnection(username, {
                        signWebcastRequest: async (url, headers) => {
                            try {
                                const signResponse = await fetch('https://tiktok.eulerstream.com/api/v1/webcast/sign_url', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'X-API-Key': EULER_STREAM_API_KEY,
                                    },
                                    body: JSON.stringify({ url }),
                                });

                                const signedData = await signResponse.json();

                                if (signedData.error) {
                                    throw new Error(signedData.error);
                                }

                                return {
                                    ...signedData,
                                    "User-Agent": headers['User-Agent'],
                                };
                            } catch (err) {
                                console.error('[Server Log] Error during signing request:', err);
                                throw err;
                            }
                        }
                    });
                    // =================================================================

                    activeConnections.set(ws, tiktokConnection);
                    setupEventHandlers(tiktokConnection, ws, username);

                    await tiktokConnection.connect();

                } catch (connectionError) {
                    console.error(`[Server Log] ERROR during TikTok connection process for @${username}:`, connectionError.message);
                    ws.send(JSON.stringify({ type: 'error', message: `Failed to connect to TikTok: ${connectionError.message}` }));
                    if(activeConnections.has(ws)) {
                        activeConnections.get(ws).disconnect();
                        activeConnections.delete(ws);
                    }
                }
            }
        } catch (parseError) {
            console.error('[Server Log] ERROR parsing message from client:', parseError);
        }
    });

    ws.on('close', () => {
        console.log('[Server Log] Client disconnected.');
        if (activeConnections.has(ws)) {
            activeConnections.get(ws).disconnect();
            activeConnections.delete(ws);
        }
    });
});

// --- 4. Fungsi Bantuan untuk Event Handler (Tidak ada perubahan di sini) ---
function setupEventHandlers(tiktokConnection, ws, username) {
    tiktokConnection.on('connected', (state) => {
        console.log(`[Server Log] Successfully connected to @${username}'s Room ID ${state.roomId}`);
        ws.send(JSON.stringify({ type: 'connected', message: `BERHASIL terhubung ke @${username} (Room ID: ${state.roomId})` }));
    });
    tiktokConnection.on('disconnected', () => {
        console.log(`[Server Log] TikTok connection for @${username} disconnected.`);
        ws.send(JSON.stringify({ type: 'disconnected', message: 'Koneksi ke TikTok terputus.' }));
    });
    tiktokConnection.on(WebcastEvent.CHAT, (data) => {
        const chatMessage = { type: 'chat', data: { uniqueId: data.uniqueId, comment: data.comment } };
        ws.send(JSON.stringify(chatMessage));
    });
    tiktokConnection.on(WebcastEvent.GIFT, (data) => {
        if (data.gift && data.gift.gift_name) {
            const giftMessage = { type: 'gift', data: { uniqueId: data.uniqueId, giftName: data.gift.gift_name, repeatCount: data.gift.repeat_count } };
            ws.send(JSON.stringify(giftMessage));
        }
    });
    tiktokConnection.on('error', (error) => {
        console.error(`[Server Log] Error from TikTokLiveConnection for @${username}:`, error);
        ws.send(JSON.stringify({ type: 'error', message: `An error occurred with the TikTok connection: ${error.message}` }));
    });
}

// --- 5. Jalankan Server ---
server.listen(PORT, () => {
    console.log(`[Server Log] WebSocket server is listening on port ${PORT}`);
});

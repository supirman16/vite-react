// tiktok-server.js (Versi Debug Sederhana)
import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 8080;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Endpoint untuk Health Check
app.get('/', (req, res) => {
  res.status(200).send('Simple Echo WebSocket Server is running.');
});

wss.on('connection', (ws) => {
    console.log('[Server] Klien terhubung ke server echo.');
    ws.send(JSON.stringify({ type: 'status', message: 'Berhasil terhubung ke server echo!' }));

    ws.on('message', (message) => {
        const receivedMessage = message.toString();
        console.log(`[Server] Menerima: ${receivedMessage}`);
        // Mengirim kembali pesan yang diterima
        ws.send(JSON.stringify({ type: 'echo', message: `Server menerima pesan Anda: "${receivedMessage}"` }));
    });

    ws.on('close', () => {
        console.log('[Server] Klien terputus.');
    });
});

server.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});

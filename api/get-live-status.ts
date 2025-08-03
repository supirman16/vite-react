import type { VercelRequest, VercelResponse } from '@vercel/node';
import { WebcastPushConnection } from 'tiktok-live-connector';

export default function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // Menangani CORS untuk permintaan preflight dan permintaan utama
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  const { username } = request.body;

  if (!username) {
    return response.status(400).json({ error: 'Username is required' });
  }

  try {
    let tiktokLiveConnection = new WebcastPushConnection(username);

    tiktokLiveConnection.connect().then(state => {
      // Jika berhasil terhubung, berarti sedang live
      tiktokLiveConnection.disconnect();
      response.status(200).json({ isLive: true });
    }).catch(err => {
      // Jika gagal, berarti tidak live
      response.status(200).json({ isLive: false, error: err.message });
    });

  } catch (err: any) {
    // Menangkap error lain jika inisiasi gagal
    response.status(200).json({ isLive: false, error: err.message });
  }
}

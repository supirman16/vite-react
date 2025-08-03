import type { VercelRequest, VercelResponse } from '@vercel/node';
import { TikTokLiveConnection } from 'tiktok-live-connector';

// Jadikan fungsi handler menjadi async
export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // Menangani CORS untuk permintaan preflight dan permintaan utama
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Tangani permintaan preflight OPTIONS
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }
  
  // Pastikan ini adalah permintaan POST
  if (request.method !== 'POST') {
      return response.status(405).json({ error: 'Method Not Allowed' });
  }

  // Bungkus logika utama dalam try...catch untuk menangani eror tak terduga
  try {
    const { username } = request.body;

    if (!username) {
      return response.status(400).json({ error: 'Username is required' });
    }

    // Gunakan try...catch baru khusus untuk operasi koneksi
    try {
      const tiktokLiveConnection = new TikTokLiveConnection(username, {
          // Tambahkan timeout untuk mencegah serverless function timeout (misal, 7 detik)
          // Ini penting karena batas default Vercel adalah 10 detik
          timeout: 7000 
      });

      // Tunggu (await) hingga koneksi selesai
      const state = await tiktokLiveConnection.connect();
      
      // Jika berhasil, putuskan koneksi dan kirim respons sukses
      tiktokLiveConnection.disconnect();
      return response.status(200).json({ isLive: true, roomId: state.roomId });

    } catch (err: any) {
      // Jika connect() gagal (misal, user tidak live), ini adalah hasil yang diharapkan.
      // Kirim respons 200 OK dengan status isLive: false.
      return response.status(200).json({ isLive: false, error: err.message || 'User is not live or connection failed.' });
    }

  } catch (err: any) {
    // Catch ini akan menangani eror internal lainnya (misal: request body tidak valid)
    // dan mengembalikan status 500 yang sebenarnya.
    console.error('Internal Server Error in get-live-status:', err);
    return response.status(500).json({ error: 'An internal server error occurred.', details: err.message });
  }
}

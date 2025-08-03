import type { VercelRequest, VercelResponse } from '@vercel/node';
// Kita akan menggunakan library-nya langsung di sini
import { TikTokLiveConnection } from 'tiktok-live-connector';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // Menangani CORS
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }
  
  if (request.method !== 'POST') {
      return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { username } = request.body;

    if (!username) {
      return response.status(400).json({ error: 'Username is required' });
    }

    // Gunakan try...catch khusus untuk operasi koneksi
    try {
      // Buat koneksi baru menggunakan library
      const tiktokConnection = new TikTokLiveConnection(username, {
          // Opsi ini penting untuk lingkungan serverless agar tidak menggantung
          processInitialData: false,
          fetchRoomInfoOnConnect: true,
      });

      // Coba terhubung. Await akan menunggu hingga selesai atau gagal.
      const state = await tiktokConnection.connect();
      
      // Jika berhasil, langsung putuskan koneksi dan kirim respons sukses
      tiktokConnection.disconnect();
      return response.status(200).json({ isLive: true, roomId: state.roomId });

    } catch (err: any) {
      // Jika connect() gagal (misal, user tidak live), ini adalah hasil yang diharapkan.
      // Kirim respons 200 OK dengan status isLive: false.
      return response.status(200).json({ isLive: false, error: err.message || 'User is not live or connection failed.' });
    }

  } catch (err: any) {
    // Menangani eror tak terduga lainnya
    console.error('Internal Server Error in get-live-status:', err);
    return response.status(500).json({ error: 'An internal server error occurred.', details: err.message });
  }
}

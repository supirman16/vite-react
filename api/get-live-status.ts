import type { VercelRequest, VercelResponse } from '@vercel/node';
import { TikTokLiveConnection } from 'tiktok-live-connector';

// Kunci API EulerStream dari kode Anda yang sudah ada
const EULER_STREAM_API_KEY = "ZTlhMTg4YzcyMTRhNWY1ZTk2ZTNkODcwYTE0YTQyMDcwNGFiMGIwYjc4MmZmMjljZGE1ZmEw";

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

    try {
      // Buat koneksi baru dengan konfigurasi signing yang benar
      const tiktokConnection = new TikTokLiveConnection(username, {
        // Ini adalah bagian terpenting yang menyelesaikan masalah
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
            if (signedData.error) {
                throw new Error(signedData.error);
            }
            return {
                ...signedData,
                "User-Agent": headers['User-Agent'],
            };
        }
      });

      // Coba terhubung
      const state = await tiktokConnection.connect();
      
      // Jika berhasil, langsung putuskan koneksi dan kirim respons sukses
      tiktokConnection.disconnect();
      return response.status(200).json({ isLive: true, roomId: state.roomId });

    } catch (err: any) {
      // Jika connect() gagal, kirim respons bahwa user tidak live
      return response.status(200).json({ isLive: false, error: err.message || 'User is not live or connection failed.' });
    }

  } catch (err: any) {
    // Menangani eror tak terduga lainnya
    console.error('Internal Server Error in get-live-status:', err);
    return response.status(500).json({ error: 'An internal server error occurred.', details: err.message });
  }
}

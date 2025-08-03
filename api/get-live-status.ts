import type { VercelRequest, VercelResponse } from '@vercel/node';

// --- Menggunakan API EulerStream yang lebih andal ---
const EULER_STREAM_API_URL = "https://tiktok.eulerstream.com/api/v1/user/"; 
// Kunci API ini diambil dari kode Anda yang sudah ada di TiktokPage.tsx
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

    // Panggil API EulerStream untuk memeriksa status live
    const apiResponse = await fetch(`${EULER_STREAM_API_URL}${username}/live-status`, {
        method: 'GET',
        headers: { 'X-API-Key': EULER_STREAM_API_KEY }
    });

    // Jika respons dari EulerStream tidak OK, teruskan sebagai eror
    if (!apiResponse.ok) {
        const errorBody = await apiResponse.text();
        // Kembalikan status 200 agar frontend bisa menanganinya sebagai "tidak live"
        return response.status(200).json({ 
            isLive: false, 
            error: `EulerStream API returned status ${apiResponse.status}: ${errorBody}` 
        });
    }

    const result = await apiResponse.json();

    // Kirim respons berdasarkan hasil dari EulerStream
    if (result.is_live) {
        return response.status(200).json({ isLive: true, roomId: result.room_id || 'N/A' });
    } else {
        return response.status(200).json({ isLive: false, error: 'User is not live according to EulerStream.' });
    }

  } catch (err: any) {
    // Tangani eror jaringan atau eror tak terduga lainnya
    console.error('Internal Server Error in get-live-status:', err);
    return response.status(500).json({ error: 'An internal server error occurred.', details: err.message });
  }
}

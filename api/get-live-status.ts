import type { VercelRequest, VercelResponse } from '@vercel/node';
// Menggunakan Axios untuk panggilan HTTP yang lebih stabil
import axios from 'axios';

// --- Menggunakan API EulerStream dengan endpoint yang BENAR ---
const EULER_STREAM_API_URL = "https://tiktok.eulerstream.com/api/v1/user/"; 
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

    // Panggil endpoint user info dari EulerStream menggunakan axios
    const apiResponse = await axios.get(`${EULER_STREAM_API_URL}${username}`, {
        headers: { 
            'X-API-Key': EULER_STREAM_API_KEY,
            // Beberapa API memerlukan User-Agent standar
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
        },
        // Menambahkan timeout untuk mencegah fungsi menggantung
        timeout: 10000 // 10 detik
    });

    const result = apiResponse.data;

    // Periksa properti 'is_live' dari respons
    if (result.is_live) {
        return response.status(200).json({ isLive: true, roomId: result.room_id || 'N/A' });
    } else {
        return response.status(200).json({ isLive: false, error: 'User is not live according to EulerStream.' });
    }

  } catch (err: any) {
    // Axios memberikan detail eror yang lebih baik, yang akan membantu jika masalah masih ada
    console.error('Internal Server Error in get-live-status:', err.response?.data || err.message);
    return response.status(500).json({ 
        error: 'An internal server error occurred.', 
        details: err.response?.data || err.message 
    });
  }
}

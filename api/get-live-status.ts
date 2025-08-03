import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const EULER_STREAM_API_URL = "https://tiktok.eulerstream.com/api/v1/user/"; 
const EULER_STREAM_API_KEY = "ZTlhMTg4YzcyMTRhNWY1ZTk2ZTNkODcwYTE0YTQyMDcwNGFiMGIwYjc4MmZmMjljZGE1ZmEw";

// Mengubah sintaks ekspor ke CommonJS untuk kompatibilitas Vercel
module.exports = async (request: VercelRequest, response: VercelResponse) => {
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

    const apiResponse = await axios.get(`${EULER_STREAM_API_URL}${username}`, {
        headers: { 
            'X-API-Key': EULER_STREAM_API_KEY,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
        },
        timeout: 10000 // 10 detik
    });

    const result = apiResponse.data;

    if (result.is_live) {
        return response.status(200).json({ isLive: true, roomId: result.room_id || 'N/A' });
    } else {
        return response.status(200).json({ isLive: false, error: 'User is not live according to EulerStream.' });
    }

  } catch (err: any) {
    console.error('Internal Server Error in get-live-status:', err.response?.data || err.message);
    return response.status(500).json({ 
        error: 'An internal server error occurred.', 
        details: err.response?.data || err.message 
    });
  }
};

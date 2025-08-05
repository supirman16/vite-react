import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

// Handler untuk serverless function
export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // Menangani CORS agar frontend di Vercel bisa mengakses API ini
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. Ambil kunci API dari Environment Variables yang aman di server Vercel
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Jika kunci API tidak ditemukan di server, kirim eror
      return response.status(500).json({ error: 'Kunci API Gemini tidak dikonfigurasi di server.' });
    }

    // 2. Ambil prompt yang dikirim dari frontend
    const { prompt } = request.body;
    if (!prompt) {
        return response.status(400).json({ error: 'Prompt tidak ditemukan dalam permintaan.' });
    }

    // 3. Siapkan dan panggil API Gemini dari backend
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }]
    };

    const geminiResponse = await axios.post(apiUrl, payload, {
        headers: { 'Content-Type': 'application/json' }
    });
    
    // 4. Kirim kembali hanya hasilnya ke frontend
    const analysisText = geminiResponse.data.candidates[0]?.content?.parts[0]?.text;
    if (analysisText) {
        return response.status(200).json({ analysis: analysisText });
    } else {
        return response.status(500).json({ error: 'Respons dari Gemini tidak valid.' });
    }

  } catch (error: any) {
    console.error('Error in Gemini API proxy:', error.response?.data || error.message);
    return response.status(500).json({ 
        error: 'Terjadi kesalahan internal saat memanggil API Gemini.',
        details: error.response?.data || error.message
    });
  }
}

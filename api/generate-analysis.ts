import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path'; // <-- 1. Impor modul 'path'

// 2. Secara eksplisit beritahu dotenv untuk mencari file .env.local
// di direktori utama proyek, di mana pun fungsi ini dijalankan.
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Handler untuk serverless function
export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // Menangani CORS
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
    console.log("Mencoba menjalankan fungsi generate-analysis...");
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("FATAL: Variabel lingkungan GEMINI_API_KEY tidak ditemukan.");
      return response.status(500).json({ 
          error: 'Kunci API Gemini tidak dikonfigurasi di server.',
          details: 'Pastikan file .env.local sudah benar dan server sudah di-restart.'
      });
    }
    
    console.log("GEMINI_API_KEY ditemukan, dimulai dengan:", apiKey.substring(0, 4) + "...");

    const { prompt } = request.body;
    if (!prompt) {
        console.error("Error: Prompt tidak ada di dalam body request.");
        return response.status(400).json({ error: 'Prompt tidak ditemukan dalam permintaan.' });
    }

    console.log("Mengirim permintaan ke Gemini API...");
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }]
    };

    const geminiResponse = await axios.post(apiUrl, payload, {
        headers: { 'Content-Type': 'application/json' }
    });
    
    console.log("Berhasil menerima respons dari Gemini API.");
    const analysisText = geminiResponse.data.candidates[0]?.content?.parts[0]?.text;
    
    if (analysisText) {
        return response.status(200).json({ analysis: analysisText });
    } else {
        console.error("Error: Respons dari Gemini tidak memiliki format yang diharapkan.", geminiResponse.data);
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

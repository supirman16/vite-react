import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { marked } from 'marked';

interface GeminiAnalysisCardProps {
    filteredRekap: any[];
    hosts: any[];
    dateRange: string;
}

export default function GeminiAnalysisCard({ filteredRekap, hosts, dateRange }: GeminiAnalysisCardProps) {
    const [analysis, setAnalysis] = useState('');
    const [loading, setLoading] = useState(false);

    const generateAnalysis = async () => {
        setLoading(true);
        setAnalysis('');
        const performanceData = hosts.map(host => {
            const hostRekap = filteredRekap.filter(r => r.host_id === host.id);
            const totalMinutes = hostRekap.reduce((sum, r) => sum + r.durasi_menit, 0);
            const totalDiamonds = hostRekap.reduce((sum, r) => sum + r.pendapatan, 0);
            return { nama_host: host.nama_host, total_jam: (totalMinutes / 60).toFixed(1), total_diamond: totalDiamonds, jumlah_sesi: hostRekap.length };
        });
        const prompt = `Anda adalah seorang manajer agensi TikTok yang ahli. Berdasarkan data kinerja berikut dalam format JSON untuk periode "${dateRange}", berikan analisis cerdas dalam format Markdown yang rapi: Data Kinerja: ${JSON.stringify(performanceData, null, 2)} Tolong berikan analisis dengan struktur berikut: **Ringkasan Umum:** [Satu paragraf ringkasan umum di sini] **Poin-Poin Utama:** - [Poin 1] - [Poin 2] - [Poin 3] **Saran Konkret:** [Satu saran konkret yang bisa ditindaklanjuti di sini]`;
        try {
            const response = await fetch('/api/generate-analysis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
            if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.details || `API call failed with status: ${response.status}`); }
            const result = await response.json();
            setAnalysis(marked(result.analysis) as string);
        } catch (error: any) {
            console.error("Error calling local API:", error);
            setAnalysis(`<p class="text-red-500">Terjadi kesalahan saat menghubungi layanan analisis: ${error.message}</p>`);
        } finally { setLoading(false); }
    };

    return (
        <div className="mb-8 bg-white dark:bg-stone-800 p-6 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700">
            <div className="flex justify-between items-start">
                <div><h2 className="text-xl font-semibold">Analisis Cerdas</h2><p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Dapatkan wawasan instan tentang kinerja agensi Anda dengan bantuan AI.</p></div>
                <button onClick={generateAnalysis} disabled={loading} className="unity-gradient-bg text-white font-semibold px-4 py-2 rounded-lg shadow-sm hover:opacity-90 flex items-center disabled:opacity-75"><Sparkles className={`h-5 w-5 mr-2 ${loading ? 'animate-pulse' : ''}`} />{loading ? 'Menganalisis...' : 'Buat Ringkasan'}</button>
            </div>
            {analysis && (<div className="mt-4 pt-4 border-t dark:border-stone-700 prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: analysis }} />)}
        </div>
    );
}
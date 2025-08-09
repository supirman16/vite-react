import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { Sparkles } from 'lucide-react';
import { marked } from 'marked';
import { HostPerformance } from './HostPerformanceTable'; // Impor tipe data

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    hostData: HostPerformance | null;
    dateRange: string;
}

export default function FeedbackModal({ isOpen, onClose, hostData, dateRange }: FeedbackModalProps) {
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && hostData) {
            const generateFeedback = async () => {
                setLoading(true);
                setFeedback('');
                const prompt = `Seorang host bernama "${hostData.nama_host}" memiliki statistik berikut untuk periode "${dateRange}": - Total Jam Live: ${Math.round(hostData.totalMinutes / 60)} jam - Total Diamond: ${hostData.totalDiamonds} - Efisiensi: ${hostData.efficiency} diamond/jam. Tuliskan dalam format Markdown yang rapi dengan struktur berikut: **Umpan Balik Positif:** [Satu paragraf umpan balik yang positif dan memotivasi di sini] **Saran:** [Satu saran konkret yang bisa ditindaklanjuti di sini]`;
                try {
                    const response = await fetch('/api/generate-analysis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
                    if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.details || `API call failed`); }
                    const result = await response.json();
                    setFeedback(marked(result.analysis) as string);
                } catch (error: any) {
                    setFeedback(`<p class="text-red-500">Gagal mendapatkan saran: ${error.message}</p>`);
                } finally {
                    setLoading(false);
                }
            };
            generateFeedback();
        }
    }, [isOpen, hostData, dateRange]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Saran AI untuk ${hostData?.nama_host}`}>
            {loading && <div className="flex justify-center items-center h-40"><Sparkles className="h-8 w-8 animate-pulse text-purple-500" /></div>}
            {feedback && <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: feedback }} />}
        </Modal>
    );
}
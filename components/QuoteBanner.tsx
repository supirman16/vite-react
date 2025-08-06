import { useState, useEffect, useContext } from 'react';
import { AppContext, AppContextType } from '../App';
import { Sparkles, X } from 'lucide-react';

// Komponen ini menampilkan banner motivasi yang diambil dari AI.
export default function QuoteBanner() {
    const [quote, setQuote] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const { isQuoteBannerVisible, setIsQuoteBannerVisible } = useContext(AppContext) as AppContextType;

    useEffect(() => {
        if (isQuoteBannerVisible) {
            setIsLoading(true);
            const fetchQuote = async () => {
                try {
                    const prompt = "Berikan satu kutipan motivasi singkat (kurang dari 15 kata) untuk memulai hari kerja. Gunakan bahasa Indonesia yang santai dan positif.";
                    const response = await fetch('/api/generate-analysis', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ prompt })
                    });
                    if (!response.ok) throw new Error('Gagal mendapatkan kutipan.');
                    const result = await response.json();
                    setQuote(result.analysis || "Setiap hari adalah kesempatan baru untuk bersinar.");
                } catch (error) {
                    console.error("Gagal mengambil kutipan harian:", error);
                    setQuote("Setiap hari adalah kesempatan baru untuk bersinar.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchQuote();
        }
    }, [isQuoteBannerVisible]);

    const handleClose = () => {
        setIsQuoteBannerVisible(false);
    };

    if (!isQuoteBannerVisible) {
        return null;
    }

    return (
        <div className="flex items-center justify-between gap-x-6 bg-white/70 dark:bg-stone-900/70 backdrop-blur-lg px-6 py-2.5 sm:px-3.5 animate-fade-in border-b border-stone-200/80 dark:border-stone-800/80">
            <div className="flex items-center gap-x-4">
                <Sparkles className="h-5 w-5 text-yellow-500 hidden sm:block" />
                <p className="text-sm leading-6 text-stone-800 dark:text-stone-200">
                    {isLoading ? 'Memuat kutipan...' : quote}
                </p>
            </div>
            <div className="flex justify-end">
                <button type="button" className="-m-3 p-3 focus-visible:outline-offset-[-4px] text-stone-600 dark:text-stone-300" onClick={handleClose}>
                    <span className="sr-only">Tutup</span>
                    <X className="h-5 w-5" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}

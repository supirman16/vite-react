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
        <div className="flex items-center justify-between gap-x-6 bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-cyan-500/5 backdrop-blur-md px-6 py-2 sm:px-3.5 animate-fade-in border-b-[3px] border-stone-900 dark:border-cyan-500/10 transition-colors duration-300">
            <div className="flex items-center gap-x-3.5 overflow-hidden py-1">
                {/* Mini Mascot Avatar - Manga Styled Circular Badge */}
                <div className="h-8 w-8 rounded-full bg-pink-100 dark:bg-cyan-500/10 border-2 border-stone-900 dark:border-stone-100 flex items-center justify-center p-0.5 shadow-[2px_2px_0px_0px_#ec4899] dark:shadow-[2px_2px_0px_0px_#06b6d4] animate-float-fast shrink-0 overflow-hidden">
                    <img src="/anime_mascot.png" alt="Mascot Avatar" className="w-full h-full object-cover rounded-full" />
                </div>
                
                {/* Dialogue bubble-like speech: Comic Style */}
                <div className="relative bg-white/95 dark:bg-stone-800 px-3 py-1.5 rounded-xl border-[3px] border-stone-900 dark:border-stone-100 shadow-[3px_3px_0px_0px_#ec4899] dark:shadow-[3px_3px_0px_0px_#06b6d4] max-w-xl text-xs sm:text-sm font-extrabold text-stone-900 dark:text-white truncate">
                    {isLoading ? 'Memuat pesan harian... (・_・;)' : `"${quote}" (✿◡‿◡) ✨`}
                    {/* Comic dialogue pointer tail */}
                    <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2.5 h-2.5 bg-white dark:bg-stone-800 border-l-[3px] border-b-[3px] border-stone-900 dark:border-stone-100 transform rotate-45"></div>
                </div>
            </div>
            <div className="flex justify-end shrink-0">
                <button type="button" className="-m-3 p-3 focus-visible:outline-offset-[-4px] text-stone-500 hover:text-pink-500 dark:text-stone-400 dark:hover:text-cyan-300 transition-colors" onClick={handleClose}>
                    <span className="sr-only">Tutup</span>
                    <X className="h-4 w-4" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Check, ShieldAlert, Award, AlertTriangle, Play, Sparkles, ShieldCheck, Heart, Diamond, Info, MessageCircle, AlertOctagon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RulesBoardModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type TabType = 'wfo' | 'kewajiban' | 'konten' | 'ringan' | 'berat';

export default function RulesBoardModal({ isOpen, onClose }: RulesBoardModalProps) {
    const [activeTab, setActiveTab] = useState<TabType>('wfo');

    // Reset tab to WFO when modal is opened
    useEffect(() => {
        if (isOpen) {
            setActiveTab('wfo');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Get mascot comments and expressions depending on slide
    const getMascotBubble = () => {
        switch (activeTab) {
            case 'wfo':
                return {
                    text: "Halo Senpai! Selamat datang di keluarga besar PT. Barisan Kreatif Media! 🌸 Mari pahami kebijakan WFO kita ya!",
                    emotion: "happy",
                    color: "border-pink-500 text-pink-600 dark:border-cyan-400 dark:text-cyan-400"
                };
            case 'kewajiban':
                return {
                    text: "Patuhi kewajiban utama Senpai, terutama menjaga kerahasiaan & reputasi agensi kita tercinta! ⭐📋",
                    emotion: "smart",
                    color: "border-purple-500 text-purple-600 dark:border-cyan-400 dark:text-cyan-300"
                };
            case 'konten':
                return {
                    text: "Mainkan Roblox, Minecraft, GTA V atau Only Climb secara menarik & fokus kumpulkan diamond sebanyak-banyaknya! 🎮💎✨",
                    emotion: "excited",
                    color: "border-cyan-500 text-cyan-600 dark:border-cyan-400 dark:text-cyan-400"
                };
            case 'ringan':
                return {
                    text: "Hati-hati Senpai! Terlambat, berkata toxic, atau merokok/main HP saat Live bisa kena sanksi teguran! ⚠️",
                    emotion: "worried",
                    color: "border-amber-500 text-amber-600 dark:border-amber-400 dark:text-amber-400"
                };
            case 'berat':
                return {
                    text: "PENTING SEKALI! Pelanggaran berat seperti mencuri, pelecehan, menyebar info rahasia, atau live mabuk akan langsung DIKELUARKAN! 🚫💢",
                    emotion: "angry",
                    color: "border-red-500 text-red-600 dark:border-red-400 dark:text-red-400"
                };
            default:
                return { text: "", emotion: "happy", color: "" };
        }
    };

    const mascotBubble = getMascotBubble();

    // Render mascot image depending on active tab
    const getMascotImage = () => {
        if (activeTab === 'ringan' || activeTab === 'berat') {
            return "/sidebar_mascot.png"; // Mascot looks alert/concerned
        }
        return "/dashboard_mascot.png"; // Mascot looks happy/welcoming
    };

    const tabsList: { id: TabType; label: string; icon: any; colorClass: string }[] = [
        { id: 'wfo', label: 'Kebijakan WFO', icon: Info, colorClass: 'border-pink-500 hover:bg-pink-500/10' },
        { id: 'kewajiban', label: 'Aturan Utama', icon: ShieldCheck, colorClass: 'border-purple-500 hover:bg-purple-500/10' },
        { id: 'konten', label: 'Konten Gaming', icon: Play, colorClass: 'border-cyan-500 hover:bg-cyan-500/10' },
        { id: 'ringan', label: 'Sanksi Teguran', icon: AlertTriangle, colorClass: 'border-amber-500 hover:bg-amber-500/10' },
        { id: 'berat', label: 'Sanksi Dikeluarkan', icon: AlertOctagon, colorClass: 'border-red-500 hover:bg-red-500/10' },
    ];

    return ReactDOM.createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true">
                    {/* Backdrop */}
                    <motion.div 
                        className="fixed inset-0 bg-black/75 backdrop-blur-md"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        aria-hidden="true"
                    ></motion.div>

                    {/* Main Board Container */}
                    <motion.div 
                        className="relative w-full max-w-5xl bg-white dark:bg-stone-900 rounded-3xl border-[4px] border-stone-900 dark:border-stone-100 shadow-[8px_8px_0px_0px_#ec4899] dark:shadow-[8px_8px_0px_0px_#06b6d4] overflow-hidden z-10 flex flex-col lg:flex-row max-h-[95vh] lg:max-h-[80vh] gaming-modal-bg"
                        initial={{ opacity: 0, scale: 0.9, rotate: -0.5 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.9, rotate: 0.5 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                    >
                        {/* Halftone / Screentone Background */}
                        <div className="absolute inset-0 manga-screentone pointer-events-none opacity-[0.15] dark:opacity-[0.25]"></div>
                        
                        {/* Speed lines in the header section */}
                        <div className="absolute inset-x-0 top-0 h-24 manga-speed-lines pointer-events-none opacity-30"></div>

                        {/* CLOSE BUTTON */}
                        <button 
                            onClick={onClose} 
                            className="absolute top-4 right-4 p-2 rounded-xl bg-stone-100 hover:bg-red-500 border-2 border-stone-900 dark:border-stone-100 hover:text-white text-stone-900 dark:bg-stone-800 dark:text-stone-100 shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0px_0px_#000] dark:hover:shadow-[1px_1px_0px_0px_#fff] active:translate-y-[2px] active:translate-x-[2px] active:shadow-[0px_0px_0px_0px_#000] transition-all z-30"
                            aria-label="Tutup"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {/* SISI KIRI: SPLASH BANNER MASKOT ANIME BESAR (lg: col-span-5) */}
                        <div className="lg:w-[40%] bg-gradient-to-b from-purple-500/20 via-pink-500/25 to-cyan-500/20 p-5 lg:p-8 flex flex-col justify-between items-center text-center relative border-b-[4px] lg:border-b-0 lg:border-r-[4px] border-stone-900 dark:border-stone-100 shrink-0 overflow-hidden select-none">
                            {/* Neon Portal Effect */}
                            <div className="absolute w-64 h-64 rounded-full bg-gradient-to-tr from-pink-500 via-purple-600 to-cyan-500 opacity-20 blur-2xl animate-pulse top-10"></div>
                            
                            {/* Top Title/Label Bubble */}
                            <div className="relative z-10 w-full mb-2">
                                <span className="px-3 py-1 text-[9px] font-extrabold uppercase tracking-widest text-stone-900 dark:text-white bg-white dark:bg-stone-800 border-[2.5px] border-stone-900 dark:border-stone-100 rounded-xl shadow-[2.5px_2.5px_0px_0px_#ec4899] dark:shadow-[2.5px_2.5px_0px_0px_#06b6d4] inline-block -rotate-1">
                                    PT. Barisan Kreatif Media
                                </span>
                                <h2 className="mt-3.5 text-xl lg:text-2xl font-extrabold text-stone-900 dark:text-white leading-tight uppercase bangers-font tracking-wide">
                                    RULES & REGULATIONS
                                </h2>
                            </div>

                            {/* Dynamic Speech Bubble */}
                            <div className={`relative z-10 bg-white dark:bg-stone-800 border-[3px] border-stone-900 dark:border-stone-100 px-4 py-2.5 rounded-2xl shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] text-center my-2 max-w-[95%] transform rotate-1 transition-all duration-350 ${mascotBubble.color}`}>
                                <p className="text-xs font-extrabold leading-relaxed">
                                    {mascotBubble.text}
                                </p>
                                {/* Comic Dialogue Tail */}
                                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-stone-800 border-r-[3px] border-b-[3px] border-stone-900 dark:border-stone-100 transform rotate-45"></div>
                            </div>

                            {/* Big Portrait Mascot Image - Styled as a Premium Comic Sticker/Card */}
                            <div className="relative w-40 h-40 sm:w-48 sm:h-48 lg:w-56 lg:h-56 mt-2 flex items-center justify-center bg-white border-[3px] border-stone-900 rounded-2xl shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] rotate-2 overflow-hidden animate-float-slow">
                                <img 
                                    src={getMascotImage()} 
                                    alt="Unity Agency Mascot" 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            
                            <div className="relative z-10 mt-1 bg-stone-950/80 dark:bg-stone-950 px-3.5 py-1.5 rounded-lg border-2 border-stone-900 dark:border-stone-800 shadow-[2px_2px_0px_0px_#000]">
                                <span className="text-[9px] uppercase font-black text-pink-400 tracking-wider">WFO POLICY PANEL</span>
                            </div>
                        </div>

                        {/* SISI KANAN: MENU TABS & DETAILED RULES (Tabbed layout) */}
                        <div className="flex-1 p-5 sm:p-6 lg:p-9 flex flex-col justify-between overflow-y-auto max-h-[55vh] sm:max-h-[60vh] lg:max-h-full">
                            
                            {/* CATEGORY TABS - Scrollable on mobile */}
                            <div className="flex-shrink-0 mb-5 pb-1 overflow-x-auto scrollbar-none flex gap-2.5 border-b-2 border-stone-200 dark:border-stone-800 select-none">
                                {tabsList.map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-2 px-3.5 py-2.5 border-[3px] border-stone-900 dark:border-stone-100 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-200 whitespace-nowrap ${
                                                isActive
                                                    ? 'bg-gradient-to-r from-pink-500 to-cyan-500 text-white shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff] translate-x-[-1px] translate-y-[-1px]'
                                                    : `bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 shadow-[1.5px_1.5px_0px_#000] dark:shadow-[1.5px_1.5px_0px_#fff] ${tab.colorClass}`
                                            }`}
                                        >
                                            <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                                            <span>{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* SCROLLABLE DETAILED CONTENT */}
                            <div className="flex-1 flex flex-col justify-start min-h-[220px] overflow-y-auto pr-1.5 scrollbar-thin">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeTab}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -15 }}
                                        transition={{ duration: 0.22, ease: 'easeOut' }}
                                        className="w-full space-y-4"
                                    >
                                        {/* TAB 1: KEBIJAKAN HOST OFFLINE GAMING (WFO) */}
                                        {activeTab === 'wfo' && (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="p-2.5 bg-pink-100 dark:bg-pink-950/40 rounded-xl border-2 border-stone-900 dark:border-stone-100 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] -rotate-2">
                                                        <Info className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] uppercase font-black text-stone-400 dark:text-stone-500 tracking-widest">KATEGORI 01</span>
                                                        <h3 className="text-lg font-extrabold text-stone-900 dark:text-white uppercase tracking-wider">
                                                            Kebijakan Host Offline Gaming (WFO)
                                                        </h3>
                                                    </div>
                                                </div>

                                                <p className="text-xs font-extrabold text-stone-600 dark:text-stone-400 leading-relaxed">
                                                    Panduan kerja profesional bagi seluruh host WFO di bawah naungan <span className="text-stone-900 dark:text-white underline decoration-pink-500 decoration-[2.5px]">PT. Barisan Kreatif Media</span>. Harap dipahami dengan saksama:
                                                </p>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                                    <div className="bg-stone-50 dark:bg-stone-800 p-4 border-[3px] border-stone-900 dark:border-stone-100 rounded-2xl shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff] transform rotate-1">
                                                        <span className="block text-xl mb-1.5">⏰</span>
                                                        <span className="block text-[9px] uppercase font-black text-stone-400 dark:text-stone-500 tracking-wider">Jam Kerja</span>
                                                        <span className="text-sm font-extrabold text-stone-900 dark:text-white">6 Jam Live Stream</span>
                                                    </div>
                                                    <div className="bg-stone-50 dark:bg-stone-800 p-4 border-[3px] border-stone-900 dark:border-stone-100 rounded-2xl shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff] transform -rotate-1">
                                                        <span className="block text-xl mb-1.5">📅</span>
                                                        <span className="block text-[9px] uppercase font-black text-stone-400 dark:text-stone-500 tracking-wider">Hari Kerja</span>
                                                        <span className="text-sm font-extrabold text-stone-900 dark:text-white">26 Hari / Bulan</span>
                                                    </div>
                                                    <div className="bg-stone-50 dark:bg-stone-800 p-4 border-[3px] border-stone-900 dark:border-stone-100 rounded-2xl shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff] transform rotate-1">
                                                        <span className="block text-xl mb-1.5">🏢</span>
                                                        <span className="block text-[9px] uppercase font-black text-stone-400 dark:text-stone-500 tracking-wider">Lokasi Kerja</span>
                                                        <span className="text-sm font-extrabold text-stone-900 dark:text-white">Kantor (WFO)</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB 2: ATURAN UTAMA & KEWAJIBAN */}
                                        {activeTab === 'kewajiban' && (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="p-2.5 bg-purple-100 dark:bg-purple-950/40 rounded-xl border-2 border-stone-900 dark:border-stone-100 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] rotate-2">
                                                        <ShieldCheck className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] uppercase font-black text-stone-400 dark:text-stone-500 tracking-widest">KATEGORI 02</span>
                                                        <h3 className="text-lg font-extrabold text-stone-900 dark:text-white uppercase tracking-wider">
                                                            Aturan Utama & Kewajiban Host
                                                        </h3>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                                                    {[
                                                        "Wajib Live menunjukkan wajah, suara, dan penampilan jelas.",
                                                        "Dilarang daftar di agency lain selama masa kontrak (Eksklusif).",
                                                        "Dilarang Live di akun pribadi selama kontrak berlangsung.",
                                                        "Menjaga fasilitas kantor dan kebersihan area kerja secara berkala.",
                                                        "Dilarang menginformasikan hal-hal confidential terkait agency (alamat, informasi host, owner) dan hal personal lainnya tanpa ijin resmi.",
                                                        "Dilarang menjelek-jelekan agency di luar. Jika ada masalah wajib diselesaikan di internal lingkungan agency."
                                                    ].map((rule, idx) => (
                                                        <div key={idx} className="p-3 bg-white dark:bg-stone-800 border-2 border-stone-900 dark:border-stone-800 rounded-xl flex items-start gap-2.5 shadow-[2px_2px_0px_#000]">
                                                            <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                                                            <span className="text-xs font-extrabold text-stone-800 dark:text-stone-300 leading-relaxed">{rule}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB 3: KONTEN LIVE (GAMING) */}
                                        {activeTab === 'konten' && (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="p-2.5 bg-cyan-100 dark:bg-cyan-950/40 rounded-xl border-2 border-stone-900 dark:border-stone-100 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] -rotate-2">
                                                        <Play className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] uppercase font-black text-stone-400 dark:text-stone-500 tracking-widest">KATEGORI 03</span>
                                                        <h3 className="text-lg font-extrabold text-stone-900 dark:text-white uppercase tracking-wider">
                                                            Ketentuan Konten Live Gaming
                                                        </h3>
                                                    </div>
                                                                      <div className="space-y-3.5 pt-1">
                                                    <div className="bg-stone-50 dark:bg-stone-800 p-4 border-[3px] border-stone-900 dark:border-stone-100 rounded-2xl shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff]">
                                                        <h4 className="text-xs font-black uppercase text-pink-650 dark:text-cyan-400 tracking-wider mb-2 flex items-center gap-1.5">🎮 Fokus Game Utama</h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {['Roblox', 'GTA V', 'Minecraft', 'Only Climb'].map((game) => (
                                                                <span key={game} className="px-3 py-1 text-xs font-black bg-white dark:bg-stone-800 text-stone-900 dark:text-white border-2 border-stone-900 dark:border-stone-700 rounded-lg shadow-[2px_2px_0px_#000]">{game}</span>
                                                            ))}
                                                            <span className="px-3 py-1 text-xs font-bold text-stone-500 dark:text-stone-400 italic">dan game seru lainnya...</span>
                                                        </div>
                                                    </div>
 
                                                    <div className="p-3.5 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-2 border-stone-900 dark:border-stone-800 rounded-xl">
                                                        <h5 className="text-[11px] font-black uppercase text-purple-750 dark:text-cyan-300 tracking-wider flex items-center gap-1">🎯 Tujuan Utama Siaran</h5>
                                                        <p className="text-xs font-bold text-stone-700 dark:text-stone-300 mt-1 leading-relaxed">
                                                            Menghibur viewers, membangun interaksi komunitas yang positif, serta **berfokus penuh pada pengumpulan diamond (berlian)** siaran secara optimal.
                                                        </p>
                                                    </div>
                                                </div>                                  </div>
                                            </div>
                                        )}

                                        {/* TAB 4: PELANGGARAN RINGAN (SANKSI TEGURAN) */}
                                        {activeTab === 'ringan' && (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="p-2.5 bg-amber-100 dark:bg-amber-950/40 rounded-xl border-2 border-stone-900 dark:border-stone-100 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] rotate-2">
                                                        <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] uppercase font-black text-stone-400 dark:text-stone-500 tracking-widest">KATEGORI 04</span>
                                                        <h3 className="text-lg font-extrabold text-stone-900 dark:text-white uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                                            Pelanggaran Ringan (Sanksi Teguran)
                                                        </h3>
                                                    </div>
                                                </div>

                                                <p className="text-xs font-bold text-stone-600 dark:text-stone-400">
                                                    Tindakan di bawah ini akan mendapatkan sanksi berupa teguran keras (lisan/tertulis) demi disiplin kerja profesional:
                                                </p>

                                                <div className="space-y-2 pt-1">
                                                    {[
                                                        "Membuat gaduh/masalah interpersonal di lingkungan kerja kantor.",
                                                        "Merokok atau menggunakan Vape/Rokok Elektrik saat Live Streaming berlangsung.",
                                                        "Berkata kasar, toxic, kotor, kasar, atau tidak sopan kepada viewers/penonton.",
                                                        "Terlambat datang di room live atau tidak mematuhi jadwal yang sudah diajukan.",
                                                        "Bermain HP pribadi atau melakukan Video Call pribadi dalam waktu lama saat sedang Live siaran."
                                                    ].map((item, idx) => (
                                                        <div key={idx} className="flex items-start gap-2.5 p-2.5 bg-white dark:bg-stone-800 border-2 border-stone-900 dark:border-stone-800 rounded-xl shadow-[2.5px_2.5px_0px_#000]">
                                                            <span className="w-5.5 h-5.5 shrink-0 rounded-full bg-amber-500 text-stone-900 font-extrabold text-xs flex items-center justify-center border border-stone-900">⚠️</span>
                                                            <span className="text-xs font-extrabold text-stone-800 dark:text-stone-300">{item}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB 5: PELANGGARAN BERAT (SANKSI DIKELUARKAN) */}
                                        {activeTab === 'berat' && (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="p-2.5 bg-red-100 dark:bg-red-950/40 rounded-xl border-2 border-stone-900 dark:border-stone-100 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] -rotate-2">
                                                        <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-400" />
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] uppercase font-black text-stone-400 dark:text-stone-500 tracking-widest">KATEGORI 05</span>
                                                        <h3 className="text-lg font-extrabold text-stone-900 dark:text-white uppercase tracking-wider text-red-650 dark:text-red-400">
                                                            Pelanggaran Berat (Sanksi Pemutusan Kontrak)
                                                        </h3>
                                                    </div>
                                                </div>

                                                <p className="text-xs font-bold text-stone-600 dark:text-stone-400">
                                                    Tindakan berikut merupakan pelanggaran fatal berujung pada **sanksi dikeluarkan (pemutusan kontrak sepihak)**:
                                                </p>

                                                <div className="space-y-2 pt-1 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                                                    {[
                                                        "Mengambil keuntungan secara pribadi (misal: menerima uang/transfer cash secara langsung dari viewer).",
                                                        "Menjelek-jelekan nama baik/reputasi agensi di lingkungan luar.",
                                                        "Spill/menyebarkan informasi rahasia yang ada di agensi keluar (kebocoran rahasia).",
                                                        "Menyiarkan konten bermuatan Seksualitas/Pornografi & SARA.",
                                                        "Mencuri barang, uang, perlengkapan, atau aset milik kantor agensi.",
                                                        "Melakukan pelecehan seksual atau merayu rekan kerja/host lain secara tidak pantas.",
                                                        "Melakukan siaran Live dalam keadaan mabuk atau membawa anak kecil masuk ke dalam frame siaran."
                                                    ].map((item, idx) => (
                                                        <div key={idx} className="flex items-start gap-2.5 p-2.5 bg-red-500/5 dark:bg-red-950/10 border-2 border-red-500/30 rounded-xl">
                                                            <span className="w-5.5 h-5.5 shrink-0 rounded-full bg-red-600 text-white font-extrabold text-xs flex items-center justify-center border border-stone-900">🚨</span>
                                                            <span className="text-xs font-extrabold text-stone-900 dark:text-red-200 leading-relaxed">{item}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* FOOTER ACTION BUTTON */}
                            <div className="flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t border-stone-200 dark:border-stone-800 mt-4 select-none">
                                <div className="text-[10px] font-black text-stone-450 dark:text-stone-500 flex items-center gap-1.5 uppercase tracking-wider">
                                    <Sparkles className="h-3.5 w-3.5 text-pink-500 animate-spin" />
                                    <span>Pahami Aturan & Jaga Integritas Kerja!</span>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-full sm:w-auto px-5 py-3 border-2 border-stone-900 dark:border-stone-100 bg-gradient-to-r from-pink-500 via-purple-650 to-cyan-500 text-white font-extrabold text-xs rounded-xl shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[3px_3px_0px_#000] dark:hover:shadow-[3px_3px_0px_#fff] active:translate-y-[2px] active:translate-x-[2px] active:shadow-[1px_1px_0px_#000] transition-all flex items-center justify-center gap-2 animate-bounce [animation-duration:4.5s]"
                                >
                                    <Check className="h-4.5 w-4.5" />
                                    <span>Saya Mengerti & Siap Live! 🚀</span>
                                </button>
                            </div>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.getElementById('modal-root')!
    );
}

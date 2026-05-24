import React, { useContext, useMemo, useState, useEffect } from 'react';
import { AppContext, AppContextType } from '../App';
import { Lock, Trophy, Diamond, Clock, Star, Zap, Heart, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const tierColors: { [key: string]: { bg: string; text: string; shadow: string; border: string; icon: React.ElementType } } = {
    BRONZE: { bg: 'bg-amber-50/70 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-400', shadow: 'shadow-[4px_4px_0px_#b45309]', border: 'border-stone-900 dark:border-stone-100', icon: Trophy },
    SILVER: { bg: 'bg-slate-50/70 dark:bg-slate-900/40', text: 'text-slate-600 dark:text-slate-400', shadow: 'shadow-[4px_4px_0px_#64748b]', border: 'border-stone-900 dark:border-stone-100', icon: Trophy },
    GOLD: { bg: 'bg-yellow-50/70 dark:bg-yellow-950/40', text: 'text-yellow-700 dark:text-yellow-400', shadow: 'shadow-[4px_4px_0px_#eab308]', border: 'border-stone-900 dark:border-stone-100', icon: Trophy },
    EPIC: { bg: 'bg-purple-50/70 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-400', shadow: 'shadow-[4px_4px_0px_#a855f7]', border: 'border-stone-900 dark:border-stone-100', icon: Star },
    LEGENDARY: { bg: 'bg-orange-50/70 dark:bg-orange-950/40', text: 'text-orange-700 dark:text-orange-400', shadow: 'shadow-[4px_4px_0px_#ea580c]', border: 'border-stone-900 dark:border-stone-100', icon: Star },
};

// --- PENAMBAHAN BARU: Ikon untuk kategori baru ---
const categoryIcons: { [key: string]: React.ElementType } = {
    DIAMOND: Diamond,
    CONSISTENCY: Clock,
    PERFORMANCE: Trophy,
    EFFICIENCY: Zap,
    COMMITMENT: Heart,
    SPECIAL: Sparkles,
};

export default function AchievementsPage() {
    const { data, session } = useContext(AppContext) as AppContextType;
    const isSuperAdmin = session?.user.user_metadata.role === 'superadmin';
    
    const [selectedHostId, setSelectedHostId] = useState<string>('');

    useEffect(() => {
        if (isSuperAdmin && data.hosts.length > 0) {
            setSelectedHostId(data.hosts[0].id.toString());
        } else if (!isSuperAdmin) {
            setSelectedHostId(session?.user.user_metadata.host_id.toString() || '');
        }
    }, [isSuperAdmin, data.hosts, session]);

    const { unlocked, locked } = useMemo(() => {
        if (!selectedHostId) return { unlocked: [], locked: data.achievements };

        const hostId = parseInt(selectedHostId);
        const unlockedIds = new Set(data.hostAchievements
            .filter(ha => ha.host_id === hostId)
            .map(ha => ha.achievement_id)
        );

        const unlocked = data.achievements.filter(a => unlockedIds.has(a.id));
        const locked = data.achievements.filter(a => !unlockedIds.has(a.id));
        
        return { unlocked, locked };
    }, [data.achievements, data.hostAchievements, selectedHostId]);

    const totalAchievements = data.achievements.length;
    const progress = totalAchievements > 0 ? (unlocked.length / totalAchievements) * 100 : 0;
    const selectedHostName = data.hosts.find(h => h.id.toString() === selectedHostId)?.nama_host || '';

    return (
        <section>
            <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-wider text-stone-800 dark:text-white uppercase">KOLEKSI PENCAPAIAN</h2>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                    {isSuperAdmin ? `Lihat koleksi lencana untuk ${selectedHostName}` : 'Lencana yang Anda dapatkan dari kerja keras Anda.'}
                </p>
                
                {isSuperAdmin && (
                    <div className="mt-6 max-w-xs">
                        <label htmlFor="host-select" className="block mb-2 text-sm font-extrabold text-stone-900 dark:text-stone-300 uppercase tracking-wide">Pilih Host 👤</label>
                        <select 
                            id="host-select"
                            value={selectedHostId}
                            onChange={(e) => setSelectedHostId(e.target.value)}
                            className="bg-white dark:bg-stone-900 border-[3px] border-stone-900 dark:border-stone-100 text-stone-900 dark:text-white text-sm font-bold block w-full p-2.5 shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff] focus:outline-none"
                        >
                            {data.hosts.map(host => (
                                <option key={host.id} value={host.id}>{host.nama_host}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="mt-6 max-w-xl">
                    <div className="flex justify-between mb-2 text-sm font-extrabold text-stone-900 dark:text-stone-200 uppercase tracking-wide">
                        <span>Progres Koleksi 🏆</span>
                        <span className="font-mono font-bold">{unlocked.length} / {totalAchievements}</span>
                    </div>
                    <div className="w-full bg-stone-200 dark:bg-stone-800 border-[3px] border-stone-900 dark:border-stone-100 p-0.5 overflow-hidden shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff]">
                        <div className="unity-gradient-bg h-3.5 border-r-[2px] border-stone-900 dark:border-stone-100 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-xl font-semibold mb-4 text-stone-800 dark:text-white">🏆 Terbuka</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {unlocked.map((ach, index) => <AchievementCard key={ach.id} achievement={ach} isLocked={false} index={index} />)}
                </div>
            </div>

            <div className="mt-12">
                <h3 className="text-xl font-semibold mb-4 text-stone-800 dark:text-white">🔒 Terkunci</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {locked.map((ach, index) => <AchievementCard key={ach.id} achievement={ach} isLocked={true} index={index} />)}
                </div>
            </div>
        </section>
    );
}

function AchievementCard({ achievement, isLocked, index }: { achievement: any, isLocked: boolean, index: number }) {
    const tierStyle = tierColors[achievement.tier] || tierColors['BRONZE'];
    const CategoryIcon = categoryIcons[achievement.category] || Diamond;

    return (
        <motion.div 
            className={`p-5 rounded-xl border-[3px] transition-all duration-300 ${
                isLocked 
                    ? 'bg-stone-100 dark:bg-stone-900 border-stone-400 dark:border-stone-700 opacity-60 border-dashed shadow-[2px_2px_0px_#78716c] dark:shadow-[2px_2px_0px_#44403c]' 
                    : `${tierStyle.bg} ${tierStyle.border} ${tierStyle.shadow} hover:translate-y-[-4px] hover:translate-x-[-2px]`
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.03 }}
        >
            <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-lg border-2 border-stone-900 dark:border-stone-100 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] ${isLocked ? 'bg-stone-300 dark:bg-stone-800 text-stone-600' : 'unity-gradient-bg text-white'}`}>
                    <CategoryIcon className="w-5.5 h-5.5" />
                </div>
                {isLocked && (
                    <div className="p-1.5 rounded-md bg-stone-200 dark:bg-stone-800 border-2 border-stone-900 dark:border-stone-600">
                        <Lock className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                    </div>
                )}
            </div>
            <h4 className={`mt-4 font-extrabold text-lg ${isLocked ? 'text-stone-500 dark:text-stone-500' : 'text-stone-900 dark:text-white'}`}>{achievement.name}</h4>
            <p className="text-sm text-stone-600 dark:text-stone-400 mt-2 h-12 leading-relaxed">{achievement.description}</p>
            <div className="flex justify-between items-center mt-4 pt-3 border-t-2 border-dashed border-stone-200 dark:border-stone-800">
                <div className={`text-xs font-extrabold uppercase tracking-widest ${isLocked ? 'text-stone-500' : tierStyle.text}`}>
                    {achievement.tier}
                </div>
                {!isLocked && (
                    <span className="text-[10px] bangers-font tracking-wide bg-yellow-400 text-stone-900 border-2 border-stone-900 px-2 py-0.5 rounded rotate-6 shadow-[1px_1px_0px_#000]">
                        UNLOCKED!
                    </span>
                )}
            </div>
        </motion.div>
    );
}

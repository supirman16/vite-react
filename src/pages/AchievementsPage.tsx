import React, { useContext, useMemo, useState, useEffect } from 'react';
import { AppContext, AppContextType } from '../App';
import { Lock, Trophy, Diamond, Clock, Star, Zap, Heart, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const tierColors: { [key: string]: { border: string; shadow: string; text: string; icon: React.ElementType } } = {
    BRONZE: { border: 'border-yellow-600', shadow: 'shadow-yellow-600/30', text: 'text-yellow-600', icon: Trophy },
    SILVER: { border: 'border-stone-400', shadow: 'shadow-stone-400/30', text: 'text-stone-400', icon: Trophy },
    GOLD: { border: 'border-yellow-400', shadow: 'shadow-yellow-400/30', text: 'text-yellow-400', icon: Trophy },
    EPIC: { border: 'border-purple-500', shadow: 'shadow-purple-500/30', text: 'text-purple-500', icon: Star },
    LEGENDARY: { border: 'border-orange-400', shadow: 'shadow-orange-400/30', text: 'text-orange-400', icon: Star },
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
                    <div className="mt-4 max-w-xs">
                        <label htmlFor="host-select" className="block mb-2 text-sm font-medium text-stone-900 dark:text-stone-300">Pilih Host</label>
                        <select 
                            id="host-select"
                            value={selectedHostId}
                            onChange={(e) => setSelectedHostId(e.target.value)}
                            className="bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 dark:bg-stone-700 dark:border-stone-600 dark:placeholder-stone-400 dark:text-white"
                        >
                            {data.hosts.map(host => (
                                <option key={host.id} value={host.id}>{host.nama_host}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="mt-4">
                    <div className="flex justify-between mb-1 text-sm font-medium text-purple-600 dark:text-cyan-400">
                        <span>Progres Koleksi</span>
                        <span>{unlocked.length} / {totalAchievements}</span>
                    </div>
                    <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-2.5">
                        <div className="unity-gradient-bg h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
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
            className={`p-5 rounded-xl border-2 transition-all duration-300 ${isLocked ? 'bg-stone-100 dark:bg-stone-800/50 border-stone-300 dark:border-stone-700 opacity-60' : `bg-white dark:bg-stone-900/80 ${tierStyle.border} shadow-lg ${tierStyle.shadow}`}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
        >
            <div className="flex items-start justify-between">
                <div className={`p-2 rounded-lg ${isLocked ? 'bg-stone-300 dark:bg-stone-700' : 'unity-gradient-bg'}`}>
                    <CategoryIcon className={`w-6 h-6 ${isLocked ? 'text-stone-500' : 'text-white'}`} />
                </div>
                {isLocked && <Lock className="w-5 h-5 text-stone-500" />}
            </div>
            <h4 className={`mt-3 font-bold text-lg ${isLocked ? 'text-stone-500' : 'text-stone-800 dark:text-white'}`}>{achievement.name}</h4>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 h-10">{achievement.description}</p>
            <div className={`mt-3 text-xs font-bold uppercase tracking-wider ${isLocked ? 'text-stone-500' : tierStyle.text}`}>
                {achievement.tier}
            </div>
        </motion.div>
    );
}

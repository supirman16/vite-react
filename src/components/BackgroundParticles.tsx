import { useContext, useMemo } from 'react';
import { AppContext, AppContextType } from '../App';

export default function BackgroundParticles() {
    const context = useContext(AppContext);
    if (!context) return null;

    const { theme } = context as AppContextType;
    const isDark = theme === 'dark';

    // Generate stable random properties for 20 particles
    // Memoizing ensures the particles don't re-randomize or jitter when page states change
    const particles = useMemo(() => {
        const list = [];
        for (let i = 0; i < 20; i++) {
            const sizeValue = isDark 
                ? Math.random() * 4 + 3   // 3px - 7px for cyber sparks
                : Math.random() * 12 + 8; // 8px - 20px for sakura petals
                
            list.push({
                id: i,
                left: `${Math.random() * 95}%`,
                size: `${sizeValue}px`,
                delay: `${Math.random() * 12}s`,
                duration: isDark 
                    ? `${Math.random() * 6 + 6}s`  // 6s - 12s for rising sparks
                    : `${Math.random() * 8 + 8}s`, // 8s - 16s for falling sakura
                opacity: Math.random() * 0.4 + 0.3,
            });
        }
        return list;
    }, [isDark]);

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
            {particles.map((p) => {
                if (isDark) {
                    // Cyber cyan sparks: rising glowing dots
                    return (
                        <div
                            key={p.id}
                            className="absolute rounded-full bg-cyan-400/40 shadow-[0_0_8px_rgba(6,182,212,0.6)] animate-sparks"
                            style={{
                                left: p.left,
                                width: p.size,
                                height: p.size,
                                animationDelay: p.delay,
                                animationDuration: p.duration,
                                opacity: p.opacity,
                            }}
                        />
                    );
                } else {
                    // Sakura petals: falling skewed pink circles
                    return (
                        <div
                            key={p.id}
                            className="absolute bg-pink-300/35 border border-pink-400/10 rounded-tl-[50%] rounded-br-[50%] animate-sakura"
                            style={{
                                left: p.left,
                                width: p.size,
                                height: p.size,
                                animationDelay: p.delay,
                                animationDuration: p.duration,
                                opacity: p.opacity,
                            }}
                        />
                    );
                }
            })}
        </div>
    );
}

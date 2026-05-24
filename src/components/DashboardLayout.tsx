import { useState, useContext } from 'react';
import { AppContext, AppContextType } from '../App';
import Header from './Header';
import Navigation from './Navigation';
import DashboardPage from '../pages/DashboardPage';
import LeaderboardPage from '../pages/LeaderboardPage';
import AnalysisPage from '../pages/AnalysisPage';
import RekapPage from '../pages/RekapPage';
import ProfilePage from '../pages/ProfilePage';
import MySalaryPage from '../pages/MySalaryPage';
import PayrollPage from '../pages/PayrollPage';
import HostsPage from '../pages/HostsPage';
import UsersPage from '../pages/UsersPage';
import TiktokPage from '../pages/TiktokPage';
import SettingsPage from '../pages/SettingsPage';
import QuoteBanner from './QuoteBanner';
import AnnouncementsPage from '../pages/AnnouncementsPage';
import AchievementsPage from '../pages/AchievementsPage'; // <-- Impor halaman baru
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardLayout() {
    const { page } = useContext(AppContext) as AppContextType;
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const renderPage = () => {
        switch (page) {
            case 'dashboard': return <DashboardPage />;
            case 'achievements': return <AchievementsPage />; // <-- Tambahkan case baru
            case 'announcements': return <AnnouncementsPage />;
            case 'leaderboard': return <LeaderboardPage />;
            case 'analysis': return <AnalysisPage />;
            case 'rekap': return <RekapPage />;
            case 'profile': return <ProfilePage />;
            case 'salary': return <MySalaryPage />;
            case 'payroll': return <PayrollPage />;
            case 'hosts': return <HostsPage />;
            case 'users': return <UsersPage />;
            case 'tiktok': return <TiktokPage />;
            case 'settings': return <SettingsPage />;
            default: return <DashboardPage />;
        }
    };

    const pageVariants = {
        initial: { opacity: 0, scale: 0.97, y: 12, rotate: -0.5 },
        in: { opacity: 1, scale: 1, y: 0, rotate: 0 },
        out: { opacity: 0, scale: 0.98, y: -12, rotate: 0.5 },
    };
    const pageTransition = { 
        type: 'spring', 
        stiffness: 280, 
        damping: 22 
    } as const;

    return (
        <div className="relative min-h-screen md:flex bg-stone-100 dark:bg-stone-900">
            {/* Screen Slash Transition Overlay (Persona 5 / Shonen Manga Style) */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`slash-${page}`}
                    className="fixed inset-0 z-[100] pointer-events-none overflow-hidden"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: [0, 1, 1, 0], transition: { duration: 0.6 } }
                    }}
                >
                    {/* Upper Diagonal Slash */}
                    <motion.div
                        className="absolute top-0 left-0 w-[150%] h-[60vh] bg-stone-950 border-b-[8px] border-pink-500 transform -skew-y-12 origin-top-left shadow-[0_4px_30px_rgba(236,72,153,0.35)]"
                        variants={{
                            hidden: { x: '-100%', y: '-10%' },
                            visible: { 
                                x: ['-100%', '0%', '0%', '100%'],
                                y: ['-10%', '0%', '0%', '10%'],
                                transition: { duration: 0.6, times: [0, 0.35, 0.6, 1], ease: 'easeInOut' }
                            }
                        }}
                    />
                    {/* Lower Diagonal Slash */}
                    <motion.div
                        className="absolute bottom-0 right-0 w-[150%] h-[60vh] bg-stone-950 border-t-[8px] border-cyan-400 transform -skew-y-12 origin-bottom-right shadow-[0_-4px_30px_rgba(6,182,212,0.35)]"
                        variants={{
                            hidden: { x: '100%', y: '10%' },
                            visible: { 
                                x: ['100%', '0%', '0%', '-100%'],
                                y: ['10%', '0%', '0%', '-10%'],
                                transition: { duration: 0.6, times: [0, 0.35, 0.6, 1], ease: 'easeInOut' }
                            }
                        }}
                    />
                    {/* Central Flash comic shout text */}
                    <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                        <motion.span
                            className="bangers-font text-6xl text-white bg-stone-950 px-8 py-3 border-[4px] border-white shadow-[6px_6px_0px_0px_#ec4899] dark:shadow-[6px_6px_0px_0px_#06b6d4] uppercase tracking-widest"
                            style={{ transform: 'rotate(-6deg)' }}
                            variants={{
                                hidden: { scale: 0, opacity: 0 },
                                visible: {
                                    scale: [0, 1.2, 1, 0],
                                    opacity: [0, 1, 1, 0],
                                    transition: { duration: 0.6, times: [0, 0.3, 0.6, 1], ease: 'backOut' }
                                }
                            }}
                        >
                            CUT!
                        </motion.span>
                    </div>
                </motion.div>
            </AnimatePresence>

            <div className={`fixed inset-0 z-40 bg-black/60 transition-opacity md:hidden ${ isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none' }`} onClick={() => setSidebarOpen(false)} aria-hidden="true"></div>
            <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform md:relative md:translate-x-0 ${ isSidebarOpen ? 'translate-x-0' : '-translate-x-full' }`}>
                <Navigation onClose={() => setSidebarOpen(false)} />
            </div>
            <div className="flex flex-1 flex-col">
                <div className="sticky top-0 z-30">
                    <QuoteBanner /> 
                    <Header onMenuClick={() => setSidebarOpen(true)} />
                </div>
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <AnimatePresence mode="wait">
                        <motion.div key={page} initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
                            {renderPage()}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}

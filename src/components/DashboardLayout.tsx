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
import LiveTestPage from '../pages/LiveTestPage';
import SettingsPage from '../pages/SettingsPage';
import QuoteBanner from './QuoteBanner';
import AnnouncementsPage from '../pages/AnnouncementsPage';
// --- PENAMBAHAN: Impor komponen dari framer-motion ---
import { motion, AnimatePresence } from 'framer-motion';

// Komponen ini mengatur tata letak utama dasbor.
export default function DashboardLayout() {
    const { page } = useContext(AppContext) as AppContextType;
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const renderPage = () => {
        switch (page) {
            case 'dashboard': return <DashboardPage />;
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
            case 'livetest': return <LiveTestPage />;
            case 'settings': return <SettingsPage />;
            default: return <DashboardPage />;
        }
    };

    // --- PENAMBAHAN: Variabel untuk animasi ---
    const pageVariants = {
        initial: {
            opacity: 0,
            y: 20,
        },
        in: {
            opacity: 1,
            y: 0,
        },
        out: {
            opacity: 0,
            y: -20,
        },
    };

    const pageTransition = {
        type: 'tween',
        ease: 'anticipate',
        duration: 0.5,
    };

    return (
        <div className="relative min-h-screen md:flex bg-stone-100 dark:bg-stone-900">
            <div
                className={`fixed inset-0 z-40 bg-black/60 transition-opacity md:hidden ${
                    isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setSidebarOpen(false)}
                aria-hidden="true"
            ></div>

            <div
                className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform md:relative md:translate-x-0 ${
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <Navigation onClose={() => setSidebarOpen(false)} />
            </div>

            <div className="flex flex-1 flex-col">
                <div className="sticky top-0 z-30">
                    <QuoteBanner /> 
                    <Header onMenuClick={() => setSidebarOpen(true)} />
                </div>
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {/* --- PERUBAHAN: Bungkus konten halaman dengan AnimatePresence dan motion.div --- */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={page} // Kunci unik agar AnimatePresence mendeteksi perubahan
                            initial="initial"
                            animate="in"
                            exit="out"
                            variants={pageVariants}
                            transition={pageTransition}
                        >
                            {renderPage()}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}

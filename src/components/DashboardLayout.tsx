import { useState, useContext } from 'react';
import { AppContext, AppContextType } from '../App';
import Header from './Header';
import Navigation from './Navigation';
// MobileMenu tidak lagi diimpor
// import MobileMenu from './MobileMenu'; 
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

// Komponen ini mengatur tata letak utama dasbor.
export default function DashboardLayout() {
    const { page } = useContext(AppContext) as AppContextType;
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const renderPage = () => {
        switch (page) {
            case 'dashboard': return <DashboardPage />;
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

    return (
        <div className="relative min-h-screen md:flex bg-stone-100 dark:bg-stone-900">
            {/* Overlay untuk menu mobile */}
            <div
                className={`fixed inset-0 z-20 bg-black/60 transition-opacity md:hidden ${
                    isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setSidebarOpen(false)}
                aria-hidden="true"
            ></div>

            {/* Bilah Navigasi (Sidebar) */}
            <div
                className={`fixed inset-y-0 left-0 z-30 w-64 transform transition-transform md:relative md:translate-x-0 ${
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Mengirim fungsi untuk menutup sidebar di mobile */}
                <Navigation onClose={() => setSidebarOpen(false)} />
            </div>

            {/* Konten Utama */}
            <div className="flex flex-1 flex-col">
                <Header onMenuClick={() => setSidebarOpen(true)} />
                {/* Menambahkan padding bawah untuk mobile (pb-20) untuk menggantikan ruang yang ditinggalkan oleh menu bawah */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
                    {renderPage()}
                </main>
            </div>

            {/* Menu Bawah untuk Mobile telah dihapus */}
            {/* <MobileMenu /> */}
        </div>
    );
}

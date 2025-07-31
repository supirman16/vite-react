import React, { useContext } from 'react';
import { AppContext, AppContextType } from '../App';
import Header from './Header';
import Navigation from './Navigation';
import DashboardPage from '../pages/DashboardPage';
import AnalysisPage from '../pages/AnalysisPage';
import RekapPage from '../pages/RekapPage';
import ProfilePage from '../pages/ProfilePage'; // <-- Impor baru

// Komponen ini bertanggung jawab untuk mengatur layout utama aplikasi setelah login,
// termasuk Header, Navigasi, dan konten halaman yang aktif.
export default function DashboardLayout() {
    const { page } = useContext(AppContext) as AppContextType;

    // Fungsi ini menentukan komponen halaman mana yang akan ditampilkan
    // berdasarkan state 'page' saat ini.
    const renderPage = () => {
        switch (page) {
            case 'dashboard':
                return <DashboardPage />;
            case 'analysis':
                return <AnalysisPage />;
            case 'rekap':
                return <RekapPage />;
            case 'profile':
                return <ProfilePage />; // <-- Case baru ditambahkan
            // Case untuk halaman lain akan ditambahkan di sini.
            default:
                return <DashboardPage />;
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Header />
            <Navigation />
            <main>{renderPage()}</main>
        </div>
    );
}

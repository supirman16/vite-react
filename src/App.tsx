import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { createClient, Session } from '@supabase/supabase-js';
import LoginPage from './components/LoginPage';
import DashboardLayout from './components/DashboardLayout';

// -- 1. KONFIGURASI & KLIEN SUPABASE --
const supabaseUrl = 'https://bvlzzhbvnhzvaojuqoqn.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2bHp6aGJ2bmh6dmFvanVxb3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1Nzc4NjEsImV4cCI6MjA2OTE1Mzg2MX0.ngr8Zjd5lzsOWhycC_CDb3sOwVBFl21WTWSFt_cK2Hw'; 
export const supabase = createClient(supabaseUrl, supabaseKey);

// -- 2. TIPE DATA (UNTUK TYPESCRIPT) --
// ... (Tipe data tetap sama) ...
export interface AppContextType {
    session: Session | null;
    // ... (properti lain tetap sama) ...
    showNotification: (message: string, isError?: boolean) => void;
}


// -- 3. KONTEKS UNTUK STATE MANAGEMENT --
export const AppContext = createContext<AppContextType | null>(null);

// -- 4. KOMPONEN UTAMA: App --
export default function App() {
    const [notification, setNotification] = useState<{ message: string; isError: boolean; visible: boolean } | null>(null);

    const showNotification = (message: string, isError = false) => {
        setNotification({ message, isError, visible: true });
        setTimeout(() => {
            setNotification(prev => prev ? { ...prev, visible: false } : null);
        }, 3000);
    };
    
    // ... (State dan fungsi lain tetap sama) ...

    const value = {
        // ... (properti lain tetap sama) ...
        showNotification,
    };

    return (
        <AppContext.Provider value={value}>
            <div className="bg-stone-50 text-stone-800 dark:bg-stone-900 dark:text-stone-200 min-h-screen font-sans">
                {session ? <DashboardLayout /> : <LoginPage />}
                <Notification notification={notification} />
            </div>
        </AppContext.Provider>
    );
}

// Komponen Notifikasi Baru
function Notification({ notification }: { notification: { message: string; isError: boolean; visible: boolean } | null }) {
    if (!notification) return null;

    const baseClasses = "fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white transform transition-transform duration-300 ease-in-out z-[100]";
    const colorClasses = notification.isError ? "bg-red-500" : "bg-green-500";
    const visibilityClasses = notification.visible ? "translate-x-0" : "translate-x-[120%]";

    return (
        <div className={`${baseClasses} ${colorClasses} ${visibilityClasses}`}>
            {notification.message}
        </div>
    );
}

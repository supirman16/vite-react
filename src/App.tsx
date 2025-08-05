import { useState, useEffect, createContext } from 'react';
import { createClient, Session } from '@supabase/supabase-js';
import DashboardLayout from './components/DashboardLayout';
import LoginPage from './components/LoginPage';
import { LayoutDashboard } from 'lucide-react';

// Konfigurasi Supabase
const supabaseUrl = 'https://zorudwncbfietuzxrerd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvcnVkd25jYmZpZXR1enhyZXJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NzMzNTUsImV4cCI6MjA2ODI0OTM1NX0.d6YJ8qj3Uegmei6ip52fQ0gnjJltqVDlrlbu6VXk7Ks';
export const supabase = createClient(supabaseUrl, supabaseKey);

// Tipe data untuk konteks aplikasi
export interface AppContextType {
    page: string;
    setPage: (page: string) => void;
    session: Session | null;
    logout: () => void;
    data: AppData;
    setData: React.Dispatch<React.SetStateAction<AppData>>;
    showNotification: (message: string, isError?: boolean) => void;
}

export interface AppData {
    loading: boolean;
    hosts: any[];
    rekapLive: any[];
    tiktokAccounts: any[];
    users: any[];
    user: any | null;
}

export const AppContext = createContext<AppContextType | null>(null);

// Komponen utama aplikasi
export default function App() {
    const [session, setSession] = useState<Session | null>(null);
    const [page, setPage] = useState('dashboard');
    const [notification, setNotification] = useState<{ message: string; isError: boolean } | null>(null);
    const [data, setData] = useState<AppData>({
        loading: true,
        hosts: [],
        rekapLive: [],
        tiktokAccounts: [],
        users: [],
        user: null,
    });
    
    // --- PERBAIKAN: State baru untuk menangani pemuatan autentikasi ---
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        // Mengambil sesi saat aplikasi dimuat
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setAuthLoading(false); // Selesai memeriksa sesi awal
        });

        // Mendengarkan perubahan status autentikasi
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            // Jika ada perubahan (misalnya, logout), pastikan authLoading juga false
            if (authLoading) setAuthLoading(false); 
        });

        return () => subscription.unsubscribe();
    }, [authLoading]); // Menambahkan authLoading sebagai dependensi

    // Fungsi untuk mengambil data utama aplikasi
    const fetchData = async (currentSession: Session) => {
        setData(prev => ({ ...prev, loading: true }));
        try {
            const user = currentSession.user;
            const userRole = user.user_metadata?.role;
            
            const { data: hosts } = await supabase.from('hosts').select('*');
            const { data: tiktokAccounts } = await supabase.from('tiktok_accounts').select('*');
            const { data: users } = await supabase.from('users').select('*');
            
            let rekapLive;
            if (userRole === 'superadmin') {
                const { data } = await supabase.from('rekap_live').select('*');
                rekapLive = data;
            } else {
                const host = hosts?.find(h => h.user_id === user.id);
                if (host) {
                    const { data } = await supabase.from('rekap_live').select('*').eq('host_id', host.id);
                    rekapLive = data;
                }
            }

            setData({
                loading: false,
                hosts: hosts || [],
                rekapLive: rekapLive || [],
                tiktokAccounts: tiktokAccounts || [],
                users: users || [],
                user: user,
            });
        } catch (error) {
            console.error("Error fetching data:", error);
            setData(prev => ({ ...prev, loading: false }));
        }
    };
    
    useEffect(() => {
        if (session) {
            fetchData(session);
        } else {
            // Jika tidak ada sesi, pastikan data direset dan tidak dalam status loading
            setData({ loading: false, hosts: [], rekapLive: [], tiktokAccounts: [], users: [], user: null });
        }
    }, [session]);

    const logout = async () => {
        await supabase.auth.signOut();
        setPage('dashboard'); // Reset halaman ke dashboard setelah logout
    };

    const showNotification = (message: string, isError = false) => {
        setNotification({ message, isError });
        setTimeout(() => setNotification(null), 3000);
    };

    // --- PERBAIKAN: Logika render yang lebih tangguh ---
    if (authLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-stone-100 dark:bg-stone-900">
                <LayoutDashboard className="h-8 w-8 animate-spin text-purple-500" />
            </div>
        );
    }
    
    return (
        <AppContext.Provider value={{ page, setPage, session, logout, data, setData, showNotification }}>
            {!session ? <LoginPage /> : <DashboardLayout />}
            {notification && (
                <div className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white ${notification.isError ? 'bg-red-500' : 'bg-green-500'}`}>
                    {notification.message}
                </div>
            )}
        </AppContext.Provider>
    );
}

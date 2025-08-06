import { useState, useEffect, createContext, useCallback } from 'react';
import { createClient, Session } from '@supabase/supabase-js';
import DashboardLayout from './components/DashboardLayout';
import LoginPage from './components/LoginPage';
import { LayoutDashboard } from 'lucide-react';

// Konfigurasi Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
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
    theme: string;
    setTheme: (theme: string) => void;
    isQuoteBannerVisible: boolean;
    setIsQuoteBannerVisible: (isVisible: boolean) => void;
}

export interface AppData {
    loading: boolean;
    hosts: any[];
    rekapLive: any[];
    tiktokAccounts: any[];
    users: any[];
    user: any | null;
    announcements: any[];
    announcementReads: any[];
    announcementReactions: any[];
}

export const AppContext = createContext<AppContextType | null>(null);

// Komponen utama aplikasi
export default function App() {
    const [session, setSession] = useState<Session | null>(null);
    const [page, setPage] = useState('dashboard');
    const [notification, setNotification] = useState<{ message: string; isError: boolean } | null>(null);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [isQuoteBannerVisible, setIsQuoteBannerVisible] = useState(true);
    
    const [data, setData] = useState<AppData>({
        loading: true,
        hosts: [],
        rekapLive: [],
        tiktokAccounts: [],
        users: [],
        user: null,
        announcements: [],
        announcementReads: [],
        announcementReactions: [],
    });
    
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setAuthLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (authLoading) setAuthLoading(false); 
        });

        return () => subscription.unsubscribe();
    }, [authLoading]);

    const fetchData = useCallback(async (currentSession: Session) => {
        setData(prev => ({ ...prev, loading: true }));
        try {
            const user = currentSession.user;
            const userRole = user.user_metadata?.role;
            
            const [
                { data: hosts },
                { data: tiktokAccounts },
                { data: announcements },
                { data: announcementReads },
                { data: announcementReactions }
            ] = await Promise.all([
                supabase.from('hosts').select('*'),
                supabase.from('tiktok_accounts').select('*'),
                supabase.from('announcements').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false }),
                supabase.from('announcement_reads').select('*'),
                supabase.from('announcement_reactions').select('*')
            ]);
            
            let users: any[] = [];
            let rekapLive;

            if (userRole === 'superadmin') {
                const { data: userList, error: userError } = await supabase.functions.invoke('list-all-users');
                if (userError) throw userError;
                users = userList;

                const { data } = await supabase.from('rekap_live').select('*');
                rekapLive = data;
            } else {
                // --- PERBAIKAN FINAL: Langsung gunakan host_id dari metadata pengguna ---
                const hostId = user.user_metadata?.host_id;
                if (hostId) {
                    const { data } = await supabase.from('rekap_live').select('*').eq('host_id', hostId);
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
                announcements: announcements || [],
                announcementReads: announcementReads || [],
                announcementReactions: announcementReactions || [],
            });
        } catch (error) {
            console.error("Error fetching data:", error);
            setData(prev => ({ ...prev, loading: false }));
        }
    }, []);
    
    useEffect(() => {
        if (session) {
            fetchData(session);
            setIsQuoteBannerVisible(true);
        } else {
            setData({ loading: false, hosts: [], rekapLive: [], tiktokAccounts: [], users: [], user: null, announcements: [], announcementReads: [], announcementReactions: [] });
        }
    }, [session, fetchData]);

    useEffect(() => {
        if (!session) return;

        const readsChannel = supabase.channel('announcement_reads_realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'announcement_reads' }, (payload) => {
                setData(prev => ({ ...prev, announcementReads: [...prev.announcementReads, payload.new] }));
            })
            .subscribe();

        const reactionsChannel = supabase.channel('announcement_reactions_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'announcement_reactions' }, () => {
                fetchData(session);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(readsChannel);
            supabase.removeChannel(reactionsChannel);
        };
    }, [session, fetchData]);

    const logout = async () => {
        await supabase.auth.signOut();
        setPage('dashboard');
    };

    const showNotification = (message: string, isError = false) => {
        setNotification({ message, isError });
        setTimeout(() => setNotification(null), 3000);
    };

    if (authLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-stone-100 dark:bg-stone-900">
                <LayoutDashboard className="h-8 w-8 animate-spin text-purple-500" />
            </div>
        );
    }
    
    return (
        <AppContext.Provider value={{ page, setPage, session, logout, data, setData, showNotification, theme, setTheme, isQuoteBannerVisible, setIsQuoteBannerVisible }}>
            {!session ? <LoginPage /> : <DashboardLayout />}
            {notification && (
                <div className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white ${notification.isError ? 'bg-red-500' : 'bg-green-500'}`}>
                    {notification.message}
                </div>
            )}
        </AppContext.Provider>
    );
}

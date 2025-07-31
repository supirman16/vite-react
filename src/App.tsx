import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { createClient, Session } from '@supabase/supabase-js';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { 
    LayoutDashboard, BarChart2, FileText, User, DollarSign, Settings, 
    Users, Smartphone, LogOut, Sun, Moon, Menu
} from 'lucide-react';

// -- 1. KONFIGURASI & KLIEN SUPABASE --
const supabaseUrl = 'https://bvlzzhbvnhzvaojuqoqn.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2bHp6aGJ2bmh6dmFvanVxb3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1Nzc4NjEsImV4cCI6MjA2OTE1Mzg2MX0.ngr8Zjd5lzsOWhycC_CDb3sOwVBFl21WTWSFt_cK2Hw'; 
const supabase = createClient(supabaseUrl, supabaseKey);

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// -- 2. TIPE DATA (UNTUK TYPESCRIPT) --
interface Host { id: number; nama_host: string; status: string; [key: string]: any; }
interface Rekap { id: number; host_id: number; durasi_menit: number; pendapatan: number; tanggal_live: string; [key: string]: any; }
interface AppData {
    hosts: Host[];
    tiktokAccounts: any[];
    rekapLive: Rekap[];
    users: any[];
    loading: boolean;
}
interface AppContextType {
    session: Session | null;
    data: AppData;
    fetchData: () => void;
    page: string;
    setPage: React.Dispatch<React.SetStateAction<string>>;
    theme: string;
    setTheme: React.Dispatch<React.SetStateAction<string>>;
    handleLogout: () => void;
}

// -- 3. KONTEKS UNTUK STATE MANAGEMENT --
const AppContext = createContext<AppContextType | null>(null);

// -- 4. KOMPONEN UTAMA: App --
export default function App() {
    const [session, setSession] = useState<Session | null>(null);
    const [page, setPage] = useState('dashboard');
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
    const [data, setData] = useState<AppData>({
        hosts: [],
        tiktokAccounts: [],
        rekapLive: [],
        users: [],
        loading: true,
    });

    const fetchData = useCallback(async () => {
        if (!session) return;
        setData(prev => ({ ...prev, loading: true }));
        try {
            const { data: hosts, error: hostsError } = await supabase.from('hosts').select('*');
            if (hostsError) throw hostsError;

            const { data: tiktokAccounts, error: tiktokError } = await supabase.from('tiktok_accounts').select('*');
            if (tiktokError) throw tiktokError;

            const { data: rekapLive, error: rekapError } = await supabase.from('rekap_live').select('*');
            if (rekapError) throw rekapError;

            let users: any[] = [];
            if (session.user.user_metadata?.role === 'superadmin') {
                const { data: usersResponse, error: usersError } = await supabase.functions.invoke('list-all-users');
                if (usersError) throw usersError;
                if (Array.isArray(usersResponse)) {
                    users = usersResponse;
                }
            }

            setData({ hosts: hosts || [], tiktokAccounts: tiktokAccounts || [], rekapLive: rekapLive || [], users, loading: false });
        } catch (error) {
            console.error("Error fetching data:", error);
            setData(prev => ({ ...prev, loading: false }));
        }
    }, [session]);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (session) {
            fetchData();
        }
    }, [session, fetchData]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const value = {
        session, data, fetchData, page, setPage, theme, setTheme, handleLogout
    };

    return (
        <AppContext.Provider value={value}>
            <div className="bg-stone-50 text-stone-800 dark:bg-stone-900 dark:text-stone-200 min-h-screen font-sans">
                {data.loading && !session ? <div></div> : (session ? <DashboardLayout /> : <LoginPage />)}
            </div>
        </AppContext.Provider>
    );
}

// -- 5. KOMPONEN-KOMPONEN LAIN --
// Kita akan memecah ini ke file terpisah nanti

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError('Email atau password salah.');
        setLoading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg dark:bg-stone-800">
                <div>
                    <img className="mx-auto h-20 w-auto" src="https://i.imgur.com/kwZdtFs.png" alt="Unity Agency" />
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-stone-900 dark:text-white">Login ke Dashboard</h2>
                </div>
                <form onSubmit={handleLogin} className="mt-8 space-y-6">
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="relative block w-full appearance-none rounded-md border border-stone-300 px-3 py-2 text-stone-900 placeholder-stone-500 focus:z-10 focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm dark:bg-stone-700 dark:border-stone-600 dark:placeholder-stone-400 dark:text-white" placeholder="Alamat email" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="relative block w-full appearance-none rounded-md border border-stone-300 px-3 py-2 text-stone-900 placeholder-stone-500 focus:z-10 focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm dark:bg-stone-700 dark:border-stone-600 dark:placeholder-stone-400 dark:text-white" placeholder="Password" />
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                    <button type="submit" disabled={loading} className="group relative flex w-full justify-center rounded-md border border-transparent bg-gradient-to-r from-purple-600 to-blue-500 py-2 px-4 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-75">
                        {loading ? 'Loading...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}

function DashboardLayout() {
    const { page } = useContext(AppContext)!;

    const renderPage = () => {
        switch (page) {
            case 'dashboard': return <DashboardPage />;
            case 'analysis': return <AnalysisPage />;
            default: return <DashboardPage />;
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

function Header() {
    const { theme, setTheme, handleLogout } = useContext(AppContext)!;
    
    const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

    return (
        <header className="mb-8 flex justify-between items-center">
            <div className="flex items-center space-x-4">
                <button className="md:hidden p-2 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800">
                    <Menu className="h-6 w-6" />
                </button>
                <img className="h-14 w-auto" src="https://i.imgur.com/kwZdtFs.png" alt="Unity Agency" />
            </div>
            <div className="flex items-center space-x-2">
                <button onClick={toggleTheme} title="Ubah Tema" className="p-2 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800">
                    {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </button>
                <button onClick={handleLogout} title="Logout" className="p-2 rounded-md text-red-600 hover:bg-red-100 dark:text-red-500 dark:hover:bg-red-900/50">
                    <LogOut className="h-5 w-5" />
                </button>
            </div>
        </header>
    );
}

function Navigation() {
    const { page, setPage, session } = useContext(AppContext)!;
    const isSuperAdmin = session!.user.user_metadata?.role === 'superadmin';

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['superadmin', 'host'] },
        { id: 'analysis', label: 'Analisis Kinerja', icon: BarChart2, roles: ['superadmin', 'host'] },
        { id: 'rekap', label: 'Rekap Live', icon: FileText, roles: ['superadmin', 'host'] },
        { id: 'profile', label: 'Profil Saya', icon: User, roles: ['host'] },
        { id: 'my-salary', label: 'Gaji Saya', icon: DollarSign, roles: ['host'] },
        { id: 'payroll', label: 'Sistem Gaji', icon: DollarSign, roles: ['superadmin'] },
        { id: 'settings', label: 'Pengaturan Akun', icon: Settings, roles: ['host'] },
        { id: 'hosts', label: 'Manajemen Host', icon: Users, roles: ['superadmin'] },
        { id: 'tiktok', label: 'Manajemen Akun', icon: Smartphone, roles: ['superadmin'] },
        { id: 'users', label: 'Manajemen Pengguna', icon: Users, roles: ['superadmin'] },
    ];

    const userRole = isSuperAdmin ? 'superadmin' : 'host';
    const accessibleNavItems = navItems.filter(item => item.roles.includes(userRole));

    return (
        <nav className="hidden md:block mb-8 border-b border-stone-200 dark:border-stone-700">
            <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-stone-500 dark:text-stone-400">
                {accessibleNavItems.map(item => (
                    <li key={item.id} className="mr-2">
                        <a onClick={() => setPage(item.id)} className={`nav-link inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg group cursor-pointer ${page === item.id ? 'text-purple-600 border-purple-600 dark:text-purple-500 dark:border-purple-500' : 'border-transparent hover:text-stone-600 hover:border-stone-300 dark:hover:text-stone-300'}`}>
                            <item.icon className="mr-2 h-5 w-5" />
                            {item.label}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

function DashboardPage() {
    const { data } = useContext(AppContext)!;
    
    const kpiData = [
        { title: 'Total Host Aktif', value: data.hosts.filter(h => h.status === 'Aktif').length },
        { title: 'Total Jam Live', value: `${(data.rekapLive.reduce((sum, r) => sum + r.durasi_menit, 0) / 60).toFixed(1)} jam` },
        { title: 'Total Diamond', value: `${new Intl.NumberFormat().format(data.rekapLive.reduce((sum, r) => sum + r.pendapatan, 0))} 💎` },
    ];
    
    return (
        <section>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {kpiData.map(kpi => (
                    <div key={kpi.title} className="bg-white dark:bg-stone-800 p-6 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700">
                        <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400">{kpi.title}</h3>
                        <p className="text-3xl font-bold mt-2 text-stone-900 dark:text-white">{kpi.value}</p>
                    </div>
                ))}
            </div>
            <PerformanceChart />
        </section>
    );
}

function PerformanceChart() {
    const { data } = useContext(AppContext)!;
    const [metric, setMetric] = useState('duration');

    const chartData = {
        labels: data.hosts.map(h => h.nama_host),
        datasets: [
            {
                label: metric === 'duration' ? 'Total Durasi (Jam)' : 'Total Diamond',
                data: data.hosts.map(host => {
                    const hostRekap = data.rekapLive.filter(r => r.host_id === host.id);
                    if (metric === 'duration') {
                        return hostRekap.reduce((s, r) => s + r.durasi_menit, 0) / 60;
                    }
                    return hostRekap.reduce((s, r) => s + r.pendapatan, 0);
                }),
                backgroundColor: 'rgba(168, 85, 247, 0.6)',
                borderColor: 'rgba(147, 51, 234, 1)',
                borderWidth: 1,
                borderRadius: 6,
            },
        ],
    };

    return (
         <div className="bg-white dark:bg-stone-800 p-6 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <h2 className="text-xl font-semibold">Analisis Performa Host</h2>
                <select value={metric} onChange={(e) => setMetric(e.target.value)} className="mt-2 sm:mt-0 bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full sm:w-auto p-2.5 dark:bg-stone-700 dark:border-stone-600 dark:placeholder-stone-400 dark:text-white">
                    <option value="duration">Total Durasi (Jam)</option>
                    <option value="revenue">Total Diamond</option>
                </select>
            </div>
            <div className="relative h-96">
                <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
        </div>
    );
}

function AnalysisPage() {
    return <div className="text-center p-8 bg-white dark:bg-stone-800 rounded-xl shadow-sm">Halaman Analisis Kinerja (Dalam Pengembangan)</div>;
}

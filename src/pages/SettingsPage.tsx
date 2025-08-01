import { useState } from 'react';
import { supabase } from '../App';

// Komponen ini adalah halaman Pengaturan Akun untuk host.
// Saat ini hanya berisi fungsionalitas untuk mengubah password.
export default function SettingsPage() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('Konfirmasi password tidak cocok.');
            return;
        }
        if (newPassword.length < 6) {
            setError('Password minimal harus 6 karakter.');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) {
            setError(`Gagal memperbarui password: ${error.message}`);
        } else {
            setSuccess('Password berhasil diperbarui.');
            setNewPassword('');
            setConfirmPassword('');
        }
        setLoading(false);
    };

    return (
        <section>
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100">Pengaturan Akun</h2>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Kelola informasi keamanan akun Anda.</p>
            </div>
            <div className="bg-white dark:bg-stone-800 p-6 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 max-w-lg">
                <h3 className="text-lg font-medium text-stone-900 dark:text-stone-200">Ubah Password</h3>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div>
                        <label htmlFor="new-password" className="block mb-2 text-sm font-medium text-stone-900 dark:text-stone-300">Password Baru</label>
                        <input 
                            type="password" 
                            id="new-password" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 dark:bg-stone-700 dark:border-stone-600 dark:placeholder-stone-400 dark:text-white" 
                            required 
                        />
                    </div>
                    <div>
                        <label htmlFor="confirm-password" className="block mb-2 text-sm font-medium text-stone-900 dark:text-stone-300">Konfirmasi Password Baru</label>
                        <input 
                            type="password" 
                            id="confirm-password" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 dark:bg-stone-700 dark:border-stone-600 dark:placeholder-stone-400 dark:text-white" 
                            required 
                        />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {success && <p className="text-sm text-green-500">{success}</p>}
                    <div className="flex justify-end pt-2">
                         <button type="submit" disabled={loading} className="unity-gradient-bg text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:opacity-90 flex items-center justify-center disabled:opacity-75">
                            {loading ? 'Menyimpan...' : 'Simpan Password'}
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
}

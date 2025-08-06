import { useContext } from 'react';
import { AppContext, AppContextType } from '../App';
import ProfileEditor from '../components/ProfileEditor';

// Halaman ini sekarang hanya menjadi pembungkus untuk komponen ProfileEditor,
// yang secara otomatis menggunakan ID host yang sedang login.
export default function ProfilePage() {
    const { session } = useContext(AppContext) as AppContextType;
    const hostId = session!.user.user_metadata.host_id;

    return (
        <section>
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100">Profil Saya</h2>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Perbarui data pribadi, informasi bank, dan dokumen Anda.</p>
            </div>
            <ProfileEditor hostId={hostId} />
        </section>
    );
}

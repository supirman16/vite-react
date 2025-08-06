import { useContext, useState, useMemo, useEffect, useRef } from 'react';
import { AppContext, AppContextType, supabase } from '../App';
import { Plus, Edit, Trash2, Megaphone, Pin, Info, Calendar, Eye } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import DropdownMenu from '../components/DropdownMenu';
import { marked } from 'marked';

const categories: { [key: string]: { label: string; color: string; icon: React.ElementType } } = {
    PENTING: { label: 'Penting', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: Megaphone },
    INFO: { label: 'Info', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: Info },
    EVENT: { label: 'Event', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: Calendar },
};

const availableReactions = ['👍', '🎉', '❤️', '💡'];

export default function AnnouncementsPage() {
    const { session } = useContext(AppContext) as AppContextType;
    const isSuperAdmin = session?.user?.user_metadata?.role === 'superadmin';

    return (
        <section>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100">Papan Pengumuman</h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Informasi penting dan pembaruan dari agensi.</p>
                </div>
            </div>
            {isSuperAdmin ? <SuperadminAnnouncementsView /> : <HostAnnouncementsView />}
        </section>
    );
}

function SuperadminAnnouncementsView() {
    const { data, setData, showNotification } = useContext(AppContext) as AppContextType;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(null);
    const [announcementToDelete, setAnnouncementToDelete] = useState<any | null>(null);

    const handleAdd = () => {
        setSelectedAnnouncement(null);
        setIsModalOpen(true);
    };

    const handleEdit = (announcement: any) => {
        setSelectedAnnouncement(announcement);
        setIsModalOpen(true);
    };

    const handleDelete = (announcement: any) => {
        setAnnouncementToDelete(announcement);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!announcementToDelete) return;
        try {
            await supabase.from('announcement_reactions').delete().eq('announcement_id', announcementToDelete.id);
            await supabase.from('announcement_reads').delete().eq('announcement_id', announcementToDelete.id);
            const { error } = await supabase.from('announcements').delete().eq('id', announcementToDelete.id);
            if (error) throw error;
            
            setData(prev => ({
                ...prev,
                announcements: prev.announcements.filter(a => a.id !== announcementToDelete.id)
            }));
            showNotification('Pengumuman berhasil dihapus.');
        } catch (error: any) {
            showNotification(`Gagal menghapus: ${error.message}`, true);
        } finally {
            setIsConfirmOpen(false);
            setAnnouncementToDelete(null);
        }
    };

    return (
        <>
            <div className="flex justify-end mb-4">
                <button 
                    onClick={handleAdd} 
                    className="unity-gradient-bg text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:opacity-90 flex items-center"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Buat Pengumuman
                </button>
            </div>
            <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 overflow-x-auto">
                <table className="w-full text-sm text-left text-stone-600 dark:text-stone-300">
                    <thead className="text-xs text-stone-700 dark:text-stone-400 uppercase bg-stone-100 dark:bg-stone-700">
                        <tr>
                            <th scope="col" className="px-6 py-3">Judul</th>
                            <th scope="col" className="px-6 py-3">Kategori</th>
                            <th scope="col" className="px-6 py-3">Dilihat oleh Host</th>
                            <th scope="col" className="px-6 py-3">Total Reaksi</th>
                            <th scope="col" className="px-6 py-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.announcements.map(announcement => {
                            const actions = [
                                { label: 'Ubah', icon: Edit, onClick: () => handleEdit(announcement), className: 'text-purple-600 dark:text-purple-400' },
                                { label: 'Hapus', icon: Trash2, onClick: () => handleDelete(announcement), className: 'text-red-600 dark:text-red-400' }
                            ];
                            const category = categories[announcement.category] || categories['INFO'];
                            const reads = data.announcementReads.filter(r => r.announcement_id === announcement.id).length;
                            const reactions = data.announcementReactions.filter(r => r.announcement_id === announcement.id).length;
                            return (
                                <tr key={announcement.id} className="bg-white dark:bg-stone-800 border-b dark:border-stone-700">
                                    <td className="px-6 py-4 font-medium text-stone-900 dark:text-white flex items-center">
                                        {announcement.is_pinned && <Pin className="h-4 w-4 mr-2 text-yellow-500" />}
                                        {announcement.title}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${category.color}`}>
                                            {category.label}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{reads} / {data.hosts.length}</td>
                                    <td className="px-6 py-4">{reactions}</td>
                                    <td className="px-6 py-4 text-center">
                                        <DropdownMenu actions={actions} />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {isModalOpen && <AnnouncementModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} announcement={selectedAnnouncement}/>}
            {isConfirmOpen && <ConfirmationModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleConfirmDelete} title="Konfirmasi Hapus" message={`Apakah Anda yakin ingin menghapus pengumuman "${announcementToDelete?.title}"?`}/>}
        </>
    );
}

function HostAnnouncementsView() {
    const { data } = useContext(AppContext) as AppContextType;
    const featuredAnnouncement = data.announcements.find(a => a.is_pinned) || data.announcements[0] || null;
    const otherAnnouncements = data.announcements.filter(a => a.id !== featuredAnnouncement?.id);

    if (data.announcements.length === 0) {
        return <p className="text-center text-stone-500 dark:text-stone-400 py-8">Belum ada pengumuman.</p>
    }

    return (
        <div className="space-y-8">
            {featuredAnnouncement && <AnnouncementCard announcement={featuredAnnouncement} isFeatured />}
            {otherAnnouncements.length > 0 && (
                <div>
                    <h4 className="text-lg font-semibold mb-4">Pengumuman Lainnya</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {otherAnnouncements.map(announcement => (
                            <AnnouncementCard key={announcement.id} announcement={announcement} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function AnnouncementCard({ announcement, isFeatured = false }: { announcement: any, isFeatured?: boolean }) {
    const { data, setData, session } = useContext(AppContext) as AppContextType;
    const cardRef = useRef<HTMLDivElement>(null);
    const userId = session!.user.id;

    const isRead = useMemo(() => 
        data.announcementReads.some(r => r.announcement_id === announcement.id && r.user_id === userId),
        [data.announcementReads, announcement.id, userId]
    );

    const reactions = useMemo(() => {
        const grouped = data.announcementReactions
            .filter(r => r.announcement_id === announcement.id)
            .reduce((acc, reaction) => {
                acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
        return Object.entries(grouped).sort((a, b) => b[1] - a[1]);
    }, [data.announcementReactions, announcement.id]);

    const myReaction = useMemo(() => 
        data.announcementReactions.find(r => r.announcement_id === announcement.id && r.user_id === userId),
        [data.announcementReactions, announcement.id, userId]
    );

    const markAsRead = async () => {
        if (isRead) return;
        const { error } = await supabase.from('announcement_reads').insert({ announcement_id: announcement.id, user_id: userId });
        if (!error) {
            setData(prev => ({
                ...prev,
                announcementReads: [...prev.announcementReads, { announcement_id: announcement.id, user_id: userId }]
            }));
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    markAsRead();
                    observer.disconnect();
                }
            },
            { threshold: 0.5 }
        );

        if (cardRef.current && !isRead) {
            observer.observe(cardRef.current);
        }

        return () => observer.disconnect();
    }, [isRead]);

    const handleReaction = async (emoji: string) => {
        if (myReaction) {
            if (myReaction.emoji === emoji) {
                const { error } = await supabase.from('announcement_reactions').delete().match({ id: myReaction.id });
                if (!error) {
                    setData(prev => ({ ...prev, announcementReactions: prev.announcementReactions.filter(r => r.id !== myReaction.id) }));
                }
            } else {
                const { data: updated, error } = await supabase.from('announcement_reactions').update({ emoji }).match({ id: myReaction.id }).select().single();
                if (!error) {
                     setData(prev => ({ ...prev, announcementReactions: prev.announcementReactions.map(r => r.id === myReaction.id ? updated : r) }));
                }
            }
        } else {
            const { data: newReaction, error } = await supabase.from('announcement_reactions').insert({ announcement_id: announcement.id, user_id: userId, emoji }).select().single();
            if (!error) {
                setData(prev => ({ ...prev, announcementReactions: [...prev.announcementReactions, newReaction] }));
            }
        }
    };

    const category = categories[announcement.category] || categories['INFO'];
    const cardClasses = isFeatured 
        ? "bg-white dark:bg-stone-800 p-6 rounded-2xl shadow-lg border border-purple-200 dark:border-purple-800"
        : "bg-white dark:bg-stone-800 p-5 rounded-xl shadow-md border border-stone-100 dark:border-stone-700";

    return (
        <div ref={cardRef} className={cardClasses}>
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                    {announcement.is_pinned && <Pin className="h-5 w-5 text-yellow-500 flex-shrink-0" />}
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${category.color}`}>
                        {category.label}
                    </span>
                </div>
                {!isRead && <div className="w-3 h-3 bg-blue-500 rounded-full" title="Belum dibaca"></div>}
            </div>
            <h3 className={`${isFeatured ? 'text-2xl' : 'text-md'} font-bold text-stone-900 dark:text-white mt-3 mb-2`}>{announcement.title}</h3>
            <div className="flex items-center text-xs text-stone-500 dark:text-stone-400 mt-1 mb-4">
                <span>{new Date(announcement.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <div 
                className={`prose prose-sm dark:prose-invert max-w-none ${!isFeatured && 'line-clamp-3'}`}
                dangerouslySetInnerHTML={{ __html: marked(announcement.content || '') as string }} 
            />
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-200 dark:border-stone-700">
                <div className="flex items-center space-x-2">
                    {availableReactions.map(emoji => (
                        <button 
                            key={emoji}
                            onClick={() => handleReaction(emoji)}
                            className={`px-2 py-1 rounded-full text-sm transition-transform transform hover:scale-110 ${myReaction?.emoji === emoji ? 'bg-blue-100 dark:bg-blue-900' : 'bg-stone-100 dark:bg-stone-700'}`}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
                <div className="flex items-center space-x-2">
                    {reactions.map(([emoji, count]) => (
                        <span key={emoji} className="text-sm bg-stone-100 dark:bg-stone-700 px-2 py-1 rounded-full">{emoji} {count}</span>
                    ))}
                </div>
            </div>
        </div>
    );
}

function AnnouncementModal({ isOpen, onClose, announcement }: { isOpen: boolean, onClose: () => void, announcement: any | null }) {
    const { setData, showNotification, session } = useContext(AppContext) as AppContextType;
    const [formData, setFormData] = useState({
        title: announcement?.title || '',
        content: announcement?.content || '',
        category: announcement?.category || 'INFO',
        is_pinned: announcement?.is_pinned || false,
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        setFormData(prev => ({ 
            ...prev, 
            [id]: isCheckbox ? (e.target as HTMLInputElement).checked : value 
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const announcementData = {
            ...formData,
            author_email: session?.user?.email,
        };

        try {
            if (announcement) {
                const { data: updated, error } = await supabase.from('announcements').update(announcementData).eq('id', announcement.id).select().single();
                if (error) throw error;
                setData(prev => ({ ...prev, announcements: prev.announcements.map(a => a.id === announcement.id ? updated : a) }));
                showNotification('Pengumuman berhasil diperbarui.');
            } else {
                const { data: newData, error } = await supabase.from('announcements').insert(announcementData).select().single();
                if (error) throw error;
                setData(prev => ({ ...prev, announcements: [newData, ...prev.announcements] }));
                showNotification('Pengumuman baru berhasil dipublikasikan.');
            }
            onClose();
        } catch (error: any) {
            showNotification(`Gagal menyimpan: ${error.message}`, true);
        } finally {
            setLoading(false);
        }
    };
    
    // --- PERBAIKAN: Menambahkan class untuk dark mode ---
    const commonInputClasses = "bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 dark:bg-stone-700 dark:border-stone-600 dark:placeholder-stone-400 dark:text-white";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={announcement ? 'Ubah Pengumuman' : 'Buat Pengumuman Baru'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="title" className="block mb-2 text-sm font-medium text-stone-900 dark:text-stone-300">Judul</label>
                    <input id="title" type="text" value={formData.title} onChange={handleChange} className={commonInputClasses} required />
                </div>
                <div>
                    <label htmlFor="content" className="block mb-2 text-sm font-medium text-stone-900 dark:text-stone-300">Isi Pengumuman (mendukung Markdown)</label>
                    <textarea id="content" value={formData.content} onChange={handleChange} rows={8} className={commonInputClasses} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="category" className="block mb-2 text-sm font-medium text-stone-900 dark:text-stone-300">Kategori</label>
                        <select id="category" value={formData.category} onChange={handleChange} className={commonInputClasses}>
                            {Object.keys(categories).map(key => (
                                <option key={key} value={key}>{categories[key].label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end pb-2">
                        <div className="flex items-center">
                            <input id="is_pinned" type="checkbox" checked={formData.is_pinned} onChange={handleChange} className="h-4 w-4 rounded border-stone-300 text-purple-600 focus:ring-purple-600 dark:bg-stone-600 dark:border-stone-500" />
                            <label htmlFor="is_pinned" className="ml-2 text-sm font-medium text-stone-900 dark:text-stone-300">Sematkan Pengumuman</label>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end space-x-4 pt-4">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-stone-700 bg-stone-100 rounded-lg hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300 dark:hover:bg-stone-600">Batal</button>
                    <button type="submit" disabled={loading} className="unity-gradient-bg text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:opacity-90 flex items-center justify-center disabled:opacity-75">
                        {loading ? 'Menyimpan...' : 'Publikasikan'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

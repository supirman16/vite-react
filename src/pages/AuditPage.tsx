import React, { useState, useEffect, useContext } from 'react';
import { AppContext, AppContextType } from '../App';
import { supabase } from '../App';
import { FileCheck, Upload, Clipboard, Trash2, AlertTriangle, CheckCircle, ShieldAlert, Sparkles, RefreshCw, PlusCircle, UserCheck, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PlatformLiveData {
    id?: string;
    username: string;
    start_time: string; // ISO String
    end_time: string; // ISO String
    duration: string; // e.g. "2h 0m 20s"
    durasi_menit: number;
    diamonds: number;
    created_at?: string;
}

interface AuditResult {
    platformData: PlatformLiveData;
    matchedAccount: any | null;
    matchedHost: any | null; // Determined by rekap or matched account fallback
    matchedRekap: any | null; // The specific host's submitted rekap live report
    status: 'match' | 'diff_diamonds' | 'diff_duration' | 'no_rekap' | 'unknown_account';
    differenceDetails?: string;
}

interface HostVerificationResult {
    rekap: any;
    matchedAccount: any | null;
    matchedHost: any | null;
    matchedPlatform: PlatformLiveData | null;
    status: 'verified' | 'mismatch' | 'ghost' | 'unknown_account';
    differenceDetails?: string;
}

export default function AuditPage() {
    const context = useContext(AppContext);
    if (!context) return null;

    const { data, setData, showNotification } = context as AppContextType;
    const [csvText, setCsvText] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);
    const [platformRecords, setPlatformRecords] = useState<PlatformLiveData[]>([]);
    const [auditResults, setAuditResults] = useState<AuditResult[]>([]);
    const [hostVerificationResults, setHostVerificationResults] = useState<HostVerificationResult[]>([]);
    const [activeAuditTab, setActiveAuditTab] = useState<'platform' | 'host'>('platform');
    const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'diamonds-desc' | 'diamonds-asc' | 'username-asc'>('date-desc');
    const [loading, setLoading] = useState(false);
    const [dbLoading, setDbLoading] = useState(true);
    const [duplicateOption, setDuplicateOption] = useState<'skip' | 'overwrite'>('skip');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // SQL DDL to display for user convenience
    const sqlDDL = `CREATE TABLE IF NOT EXISTS public.platform_live_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration VARCHAR(50) NOT NULL,
    durasi_menit INTEGER NOT NULL,
    diamonds INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_live_session UNIQUE (username, start_time, end_time)
);

-- JIKA TERKENA ERROR RLS (ROW-LEVEL SECURITY),
-- JALANKAN PERINTAH INI DI SUPABASE SQL EDITOR:
ALTER TABLE public.platform_live_data DISABLE ROW LEVEL SECURITY;`;

    // Load platform data from Supabase or fallback LocalStorage
    useEffect(() => {
        loadPlatformData();
    }, []);

    const loadPlatformData = async () => {
        setDbLoading(true);
        try {
            // Attempt to load from Supabase platform_live_data table
            const { data: dbData, error } = await supabase.from('platform_live_data').select('*').order('start_time', { ascending: false });
            
            if (error) {
                if (error.code === '42P01') {
                    // Table does not exist, fallback to LocalStorage
                    const localData = JSON.parse(localStorage.getItem('platform_live_data') || '[]');
                    setPlatformRecords(localData);
                    console.log("Supabase table 'platform_live_data' not found. Using LocalStorage fallback database.");
                } else if (error.code === '42501' || error.message?.toLowerCase().includes('row-level security') || error.message?.toLowerCase().includes('rls')) {
                    // RLS active and blocking read
                    const localData = JSON.parse(localStorage.getItem('platform_live_data') || '[]');
                    setPlatformRecords(localData);
                    console.log("Supabase RLS active. Using LocalStorage fallback database.");
                } else {
                    throw error;
                }
            } else if (dbData) {
                setPlatformRecords(dbData);
            }
        } catch (err: any) {
            console.error("Failed to load platform data:", err);
            showNotification("Gagal memuat data database: " + err.message, true);
        } finally {
            setDbLoading(false);
        }
    };

    // Calculate Audit Results by comparing Platform Data against Host Inputs (Rekap Live)
    useEffect(() => {
        if (platformRecords.length === 0) {
            setAuditResults([]);
            return;
        }

        const results = platformRecords.map(platform => {
            // 1. Find TikTok account matching the Excel/Platform Username
            const matchedAccount = data.tiktokAccounts.find(
                acc => acc.username.toLowerCase().trim() === platform.username.toLowerCase().trim()
            );

            if (!matchedAccount) {
                return {
                    platformData: platform,
                    matchedAccount: null,
                    matchedHost: null,
                    matchedRekap: null,
                    status: 'unknown_account' as const,
                };
            }

            // Extract date of the live session in YYYY-MM-DD
            const platformDate = new Date(platform.start_time);
            const dateStr = getLocalDateString(platformDate);

            // 2. Find ALL rekap reports matching the same TikTok account and date
            // Note: Since one TikTok account can be shared by multiple hosts (shift work),
            // we filter all host rekap reports on this account and date first!
            const matchingRekaps = data.rekapLive.filter(rekap => {
                return rekap.tiktok_account_id === matchedAccount.id && rekap.tanggal_live === dateStr;
            });

            // 3. Matchmaking logic:
            // Find which host rekap corresponds to this specific platform live record by checking:
            // a) Start time difference (in minutes)
            // b) Diamond counts
            // c) Duration difference
            let bestMatchRekap: any = null;
            let bestScore = -1;

            matchingRekaps.forEach(rekap => {
                let score = 0;

                // 1. Start Time Score (max 40 pts)
                let timeDiffMins = 9999;
                if (rekap.waktu_mulai) {
                    const [rekapH, rekapM] = rekap.waktu_mulai.split(':').map(Number);
                    const rekapStartDate = new Date(platformDate.getFullYear(), platformDate.getMonth(), platformDate.getDate(), rekapH, rekapM);
                    timeDiffMins = Math.abs(rekapStartDate.getTime() - platformDate.getTime()) / (1000 * 60);
                }

                // Enforce maximum start-time gap restriction of 180 minutes (3 hours)
                if (timeDiffMins > 180) {
                    return; // Skip this rekap entirely as it is a completely different shift/time
                }

                if (timeDiffMins <= 30) score += 40;
                else if (timeDiffMins <= 90) score += 25;
                else if (timeDiffMins <= 240) score += 10;

                // 2. Diamonds Score (max 30 pts)
                const diamondDiff = Math.abs(rekap.pendapatan - platform.diamonds);
                if (diamondDiff === 0) score += 30;
                else if (diamondDiff <= 50) score += 20;
                else if (diamondDiff <= 200) score += 10;

                // 3. Duration Score (max 30 pts)
                const durationDiff = Math.abs(rekap.durasi_menit - platform.durasi_menit);
                if (durationDiff <= 15) score += 30;
                else if (durationDiff <= 45) score += 20;
                else if (durationDiff <= 120) score += 10;

                // We require a minimum score of 10 to consider it a candidate match
                if (score >= 10 && score > bestScore) {
                    bestScore = score;
                    bestMatchRekap = rekap;
                }
            });

            // Determine host linked to the rekap, or fallback to the primary host of the account
            let matchedHost = null;
            if (bestMatchRekap) {
                matchedHost = data.hosts.find(h => h.id === bestMatchRekap.host_id);
            } else {
                matchedHost = data.hosts.find(h => h.id === matchedAccount.host_id);
            }

            // 4. Calculate Audit Status & Differences
            if (!bestMatchRekap) {
                return {
                    platformData: platform,
                    matchedAccount,
                    matchedHost,
                    matchedRekap: null,
                    status: 'no_rekap' as const,
                };
            }

            const diamondDiff = bestMatchRekap.pendapatan !== platform.diamonds;
            const durationDiff = Math.abs(bestMatchRekap.durasi_menit - platform.durasi_menit) > 5; // Allow 5 mins buffer

            if (diamondDiff && durationDiff) {
                return {
                    platformData: platform,
                    matchedAccount,
                    matchedHost,
                    matchedRekap: bestMatchRekap,
                    status: 'diff_diamonds' as const, // Combine or prioritize diamonds
                    differenceDetails: `Selisih Diamond (${bestMatchRekap.pendapatan} vs ${platform.diamonds} 💎) & Durasi (${bestMatchRekap.durasi_menit}m vs ${platform.durasi_menit}m)`
                };
            } else if (diamondDiff) {
                return {
                    platformData: platform,
                    matchedAccount,
                    matchedHost,
                    matchedRekap: bestMatchRekap,
                    status: 'diff_diamonds' as const,
                    differenceDetails: `Selisih Diamond: Rekap claimed ${bestMatchRekap.pendapatan} vs Platform ${platform.diamonds} 💎`
                };
            } else if (durationDiff) {
                return {
                    platformData: platform,
                    matchedAccount,
                    matchedHost,
                    matchedRekap: bestMatchRekap,
                    status: 'diff_duration' as const,
                    differenceDetails: `Selisih Durasi: Rekap claimed ${formatMinutes(bestMatchRekap.durasi_menit)} vs Platform ${platform.duration}`
                };
            }

            return {
                platformData: platform,
                matchedAccount,
                matchedHost,
                matchedRekap: bestMatchRekap,
                status: 'match' as const,
            };
        });

        setAuditResults(results);
    }, [platformRecords, data.rekapLive, data.tiktokAccounts, data.hosts]);

    // Calculate Host Verification Results (finding ghost claims or unverified rekaps)
    useEffect(() => {
        if (platformRecords.length === 0) {
            setHostVerificationResults([]);
            return;
        }

        const platformDates = platformRecords.map(r => getLocalDateString(new Date(r.start_time)));
        
        // Filter host rekaps that fall on dates present in the imported platform records
        const relevantRekaps = data.rekapLive.filter(rekap => platformDates.includes(rekap.tanggal_live));

        const results = relevantRekaps.map(rekap => {
            const matchedHost = data.hosts.find(h => h.id === rekap.host_id);
            const matchedAccount = data.tiktokAccounts.find(acc => acc.id === rekap.tiktok_account_id);

            if (!matchedAccount) {
                return {
                    rekap,
                    matchedAccount: null,
                    matchedHost,
                    matchedPlatform: null,
                    status: 'unknown_account' as const,
                };
            }

            // Find matching platform records on same date and same username
            const matchingPlatforms = platformRecords.filter(p => 
                p.username.toLowerCase().trim() === matchedAccount.username.toLowerCase().trim() && 
                getLocalDateString(new Date(p.start_time)) === rekap.tanggal_live
            );

            if (matchingPlatforms.length === 0) {
                return {
                    rekap,
                    matchedAccount,
                    matchedHost,
                    matchedPlatform: null,
                    status: 'ghost' as const,
                    differenceDetails: `Ghost Input: Tidak ada aktivitas siaran terdaftar di platform pada tanggal ${rekap.tanggal_live}.`
                };
            }

            // Matchmaking logic to find closest platform session:
            let bestPlatform: PlatformLiveData | null = null;
            let bestScore = -1;

            for (const p of matchingPlatforms) {
                let score = 0;

                // 1. Start Time Score (max 40 pts)
                let timeDiffMins = 9999;
                if (rekap.waktu_mulai) {
                    const [rekapH, rekapM] = rekap.waktu_mulai.split(':').map(Number);
                    const platformDate = new Date(p.start_time);
                    const rekapStartDate = new Date(platformDate.getFullYear(), platformDate.getMonth(), platformDate.getDate(), rekapH, rekapM);
                    timeDiffMins = Math.abs(rekapStartDate.getTime() - platformDate.getTime()) / (1000 * 60);
                }

                // Enforce maximum start-time gap restriction of 180 minutes (3 hours)
                if (timeDiffMins > 180) {
                    continue; // Skip this platform record entirely as it is a completely different shift/time
                }

                if (timeDiffMins <= 30) score += 40;
                else if (timeDiffMins <= 90) score += 25;
                else if (timeDiffMins <= 240) score += 10;

                // 2. Diamonds Score (max 30 pts)
                const diamondDiff = Math.abs(p.diamonds - rekap.pendapatan);
                if (diamondDiff === 0) score += 30;
                else if (diamondDiff <= 50) score += 20;
                else if (diamondDiff <= 200) score += 10;

                // 3. Duration Score (max 30 pts)
                const durationDiff = Math.abs(p.durasi_menit - rekap.durasi_menit);
                if (durationDiff <= 15) score += 30;
                else if (durationDiff <= 45) score += 20;
                else if (durationDiff <= 120) score += 10;

                // We require a minimum score of 10 to consider it a candidate match
                if (score >= 10 && score > bestScore) {
                    bestScore = score;
                    bestPlatform = p;
                }
            }

            if (!bestPlatform) {
                return {
                    rekap,
                    matchedAccount,
                    matchedHost,
                    matchedPlatform: null,
                    status: 'ghost' as const,
                    differenceDetails: `Ghost Input: Laporan klaim host tidak memiliki sesi streaming yang cocok di platform.`
                };
            }

            const diamondDiff = rekap.pendapatan !== bestPlatform.diamonds;
            const durationDiff = Math.abs(rekap.durasi_menit - bestPlatform.durasi_menit) > 5;

            if (diamondDiff || durationDiff) {
                let details = '';
                if (diamondDiff && durationDiff) {
                    details = `Selisih Diamond (Klaim: ${rekap.pendapatan} vs Platform: ${bestPlatform.diamonds} 💎) & Durasi (Klaim: ${rekap.durasi_menit}m vs Platform: ${bestPlatform.durasi_menit}m)`;
                } else if (diamondDiff) {
                    details = `Selisih Diamond: Laporan klaim ${rekap.pendapatan} vs Platform ${bestPlatform.diamonds} 💎`;
                } else {
                    details = `Selisih Durasi: Laporan klaim ${formatMinutes(rekap.durasi_menit)} vs Platform ${bestPlatform.duration}`;
                }

                return {
                    rekap,
                    matchedAccount,
                    matchedHost,
                    matchedPlatform: bestPlatform,
                    status: 'mismatch' as const,
                    differenceDetails: details
                };
            }

            return {
                rekap,
                matchedAccount,
                matchedHost,
                matchedPlatform: bestPlatform,
                status: 'verified' as const,
            };
        });

        setHostVerificationResults(results);
    }, [platformRecords, data.rekapLive, data.tiktokAccounts, data.hosts]);

    // Helpers
    const getLocalDateString = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };



    // Date Parser for "MM/DD/YYYY HH:mm"
    const parseDateTime = (str: string) => {
        if (!str) return new Date();
        const parts = str.trim().split(/\s+/);
        if (parts.length < 2) return new Date(str);
        
        const dateStr = parts[0];
        const timeStr = parts[1];
        
        const dateParts = dateStr.split(/[\/\-\.]/).map(Number);
        const timeParts = timeStr.split(':').map(Number);
        
        if (dateParts.length === 3 && timeParts.length >= 2) {
            const month = dateParts[0];
            const day = dateParts[1];
            const year = dateParts[2];
            const hours = timeParts[0];
            const minutes = timeParts[1];
            return new Date(year, month - 1, day, hours, minutes);
        }
        return new Date(str);
    };

    // Duration Parser for e.g. "2h 0m 20s" or "27m 54s"
    const parseDurationToMinutes = (durationStr: string) => {
        let totalMinutes = 0;
        const hourMatch = durationStr.match(/(\d+)\s*h/i);
        const minMatch = durationStr.match(/(\d+)\s*m/i);
        const secMatch = durationStr.match(/(\d+)\s*s/i);
        
        if (hourMatch) {
            totalMinutes += parseInt(hourMatch[1], 10) * 60;
        }
        if (minMatch) {
            totalMinutes += parseInt(minMatch[1], 10);
        }
        if (secMatch && parseInt(secMatch[1], 10) >= 30) {
            totalMinutes += 1; // Round up
        }
        return totalMinutes;
    };

    // Custom CSV and Excel TSV Parser
    const handleImportText = () => {
        if (!csvText.trim()) {
            showNotification("Silakan masukkan teks atau drag file terlebih dahulu.", true);
            return;
        }

        setLoading(true);
        try {
            const lines = csvText.split(/\r?\n/);
            if (lines.length <= 1) {
                throw new Error("Data kosong atau tidak memiliki baris nilai.");
            }

            const header = lines[0].toLowerCase().split(/\t|,|;/);
            // Find column indices dynamically
            const usernameIdx = header.findIndex(h => h.includes('username') || h.includes('user'));
            const startIdx = header.findIndex(h => h.includes('start') || h.includes('mulai'));
            const endIdx = header.findIndex(h => h.includes('end') || h.includes('selesai'));
            const durationIdx = header.findIndex(h => h.includes('duration') || h.includes('durasi') || h.includes('live duration'));
            const diamondsIdx = header.findIndex(h => h.includes('diamonds') || h.includes('berlian') || h.includes('diamond'));

            if (usernameIdx === -1 || startIdx === -1 || endIdx === -1 || durationIdx === -1 || diamondsIdx === -1) {
                throw new Error("Format kolom header tidak dikenali. Kolom wajib: Username, Start time, End time, LIVE duration, Diamonds");
            }

            const parsedData: PlatformLiveData[] = [];
            let duplicateCount = 0;

            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                const cells = lines[i].split(/\t|,|;/);
                
                if (cells.length < 5) continue;

                const username = cells[usernameIdx]?.trim();
                const startStr = cells[startIdx]?.trim();
                const endStr = cells[endIdx]?.trim();
                const duration = cells[durationIdx]?.trim();
                const diamondsVal = parseInt(cells[diamondsIdx]?.trim().replace(/,/g, ''), 10) || 0;

                if (!username || !startStr || !endStr || !duration) continue;

                const startTime = parseDateTime(startStr).toISOString();
                const endTime = parseDateTime(endStr).toISOString();
                const durasi_menit = parseDurationToMinutes(duration);

                const newRecord: PlatformLiveData = {
                    username,
                    start_time: startTime,
                    end_time: endTime,
                    duration,
                    durasi_menit,
                    diamonds: diamondsVal
                };

                // Check for duplicates in local state/already uploaded
                const isDuplicate = platformRecords.some(
                    exist => exist.username.toLowerCase() === username.toLowerCase() && 
                             exist.start_time === startTime && 
                             exist.end_time === endTime
                );

                if (isDuplicate) {
                    duplicateCount++;
                    if (duplicateOption === 'skip') {
                        continue; // Skip duplicate record
                    }
                }

                parsedData.push(newRecord);
            }

            if (parsedData.length === 0) {
                showNotification(`Impor selesai. ${duplicateCount} data duplikat dilewati. Tidak ada data baru ditambahkan.`);
                setLoading(false);
                return;
            }

            saveDataToDB(parsedData, duplicateCount);
        } catch (err: any) {
            console.error(err);
            showNotification("Gagal memproses data: " + err.message, true);
            setLoading(false);
        }
    };

    // Helper to save platform data locally
    const saveToLocalStorage = (newRecords: PlatformLiveData[]) => {
        let existing = JSON.parse(localStorage.getItem('platform_live_data') || '[]');
        if (duplicateOption === 'overwrite') {
            // Filter out any matching duplicates first
            existing = existing.filter((exist: any) => {
                return !newRecords.some(
                    r => r.username.toLowerCase() === exist.username.toLowerCase() &&
                         r.start_time === exist.start_time &&
                         r.end_time === exist.end_time
                );
            });
        }
        const merged = [...newRecords, ...existing];
        localStorage.setItem('platform_live_data', JSON.stringify(merged));
        setPlatformRecords(merged);
    };

    // Save imported data to Supabase (or fallback LocalStorage)
    const saveDataToDB = async (newRecords: PlatformLiveData[], duplicatesSkipped: number) => {
        setIsSubmitting(true);
        try {
            // First check if table exists by doing a select
            const { error: testError } = await supabase.from('platform_live_data').select('id').limit(1);
            
            if (testError && testError.code === '42P01') {
                // FALLBACK: LocalStorage
                saveToLocalStorage(newRecords);
                showNotification(`✓ Sukses Impor: Berhasil memuat ${newRecords.length} data baru ke LocalStorage (fallback). ${duplicatesSkipped} data duplikat dilewati.`);
            } else {
                // CLOUD: Insert to Supabase platform_live_data
                try {
                    if (duplicateOption === 'overwrite') {
                        // Since bulk UPSERT with custom composite unique key requires explicit setup,
                        // we can do it by inserting one by one or using standard upsert
                        const { error } = await supabase.from('platform_live_data').upsert(newRecords, {
                            onConflict: 'username,start_time,end_time'
                        });
                        if (error) throw error;
                    } else {
                        const { error } = await supabase.from('platform_live_data').insert(newRecords);
                        if (error) throw error;
                    }
                    
                    await loadPlatformData();
                    showNotification(`✓ Sukses Impor: Berhasil mengunggah ${newRecords.length} data baru ke database Supabase!`);
                } catch (dbErr: any) {
                    console.error("Database save error:", dbErr);
                    const isRLS = dbErr.message?.toLowerCase().includes('row-level security') || 
                                  dbErr.message?.toLowerCase().includes('rls') || 
                                  dbErr.code === '42501';
                    
                    if (isRLS) {
                        saveToLocalStorage(newRecords);
                        showNotification(`⚠️ RLS Aktif: Tersimpan di Lokal (LocalStorage). Salin & jalankan SQL ALTER TABLE di panel kanan Supabase Editor untuk sinkronisasi cloud!`, true);
                    } else {
                        throw dbErr;
                    }
                }
            }

            setCsvText('');
        } catch (err: any) {
            console.error(err);
            showNotification("Gagal menyimpan ke database: " + err.message, true);
        } finally {
            setIsSubmitting(false);
            setLoading(false);
        }
    };

    // Delete a single record from platform live data
    const handleDeleteRecord = async (record: PlatformLiveData) => {
        if (!window.confirm(`Hapus data platform untuk akun ${record.username}?`)) return;

        try {
            const { error } = await supabase.from('platform_live_data').delete().eq('username', record.username).eq('start_time', record.start_time);
            
            const isRLS = error && (error.code === '42501' || error.message?.toLowerCase().includes('row-level security') || error.message?.toLowerCase().includes('rls'));
            
            if ((error && error.code === '42P01') || isRLS) {
                // Fallback delete
                const updated = platformRecords.filter(
                    r => !(r.username === record.username && r.start_time === record.start_time)
                );
                localStorage.setItem('platform_live_data', JSON.stringify(updated));
                setPlatformRecords(updated);
                if (isRLS) {
                    showNotification("⚠️ RLS Aktif: Data lokal dihapus. Cloud terblokir RLS.", true);
                } else {
                    showNotification("Data lokal dihapus.");
                }
            } else if (error) {
                throw error;
            } else {
                await loadPlatformData();
                showNotification("Data berhasil dihapus dari cloud.");
            }
        } catch (err: any) {
            showNotification("Gagal menghapus: " + err.message, true);
        }
    };

    // Wipe all platform data
    const handleClearAll = async () => {
        if (!window.confirm("HAPUS SELURUH DATA platform live? Tindakan ini tidak dapat dibatalkan.")) return;

        try {
            const { error } = await supabase.from('platform_live_data').delete().neq('username', '');
            
            const isRLS = error && (error.code === '42501' || error.message?.toLowerCase().includes('row-level security') || error.message?.toLowerCase().includes('rls'));
            
            if ((error && error.code === '42P01') || isRLS) {
                localStorage.removeItem('platform_live_data');
                setPlatformRecords([]);
                if (isRLS) {
                    showNotification("⚠️ RLS Aktif: Database lokal dikosongkan. Cloud terblokir RLS.", true);
                } else {
                    showNotification("Database lokal dikosongkan.");
                }
            } else if (error) {
                throw error;
            } else {
                await loadPlatformData();
                showNotification("Seluruh data cloud berhasil dihapus.");
            }
        } catch (err: any) {
            showNotification("Gagal mengosongkan data: " + err.message, true);
        }
    };

    // One-Click Autofix to revise host's submitted rekap live report
    const handleAutoRevise = async (audit: AuditResult) => {
        if (!audit.matchedRekap) return;
        setLoading(true);
        
        try {
            const revisedData = {
                pendapatan: audit.platformData.diamonds,
                durasi_menit: audit.platformData.durasi_menit,
                waktu_selesai: formatTime(new Date(audit.platformData.end_time)),
                waktu_mulai: formatTime(new Date(audit.platformData.start_time)),
                catatan: (audit.matchedRekap.catatan || '') + '\n[Autofix: Direvisi agar sesuai data platform asli]'
            };

            const { data: updated, error } = await supabase
                .from('rekap_live')
                .update(revisedData)
                .eq('id', audit.matchedRekap.id)
                .select()
                .single();

            if (error) throw error;

            setData(prev => ({
                ...prev,
                rekapLive: prev.rekapLive.map(r => r.id === audit.matchedRekap.id ? updated : r)
            }));

            showNotification(`✓ Sukses Revisi: Rekap live ${audit.matchedHost?.nama_host || 'Host'} berhasil disesuaikan dengan data platform!`);
        } catch (err: any) {
            showNotification("Gagal merevisi: " + err.message, true);
        } finally {
            setLoading(false);
        }
    };

    // Create a new rekap live automatically for forgotten streams
    const handleCreateMissingRekap = async (audit: AuditResult, hostId: string) => {
        if (!hostId) {
            showNotification("Silakan pilih host terlebih dahulu untuk menugaskan data siaran.", true);
            return;
        }

        setLoading(true);
        try {
            const platformDate = new Date(audit.platformData.start_time);
            const dateStr = getLocalDateString(platformDate);

            const rekapData = {
                host_id: hostId,
                tiktok_account_id: audit.matchedAccount.id,
                tanggal_live: dateStr,
                waktu_mulai: formatTime(platformDate),
                waktu_selesai: formatTime(new Date(audit.platformData.end_time)),
                durasi_menit: audit.platformData.durasi_menit,
                pendapatan: audit.platformData.diamonds,
                status: 'approved',
                catatan: 'Dibuat otomatis oleh Superadmin berdasarkan data platform live asli.'
            };

            const { data: newRekap, error } = await supabase
                .from('rekap_live')
                .insert(rekapData)
                .select()
                .single();

            if (error) throw error;

            setData(prev => ({
                ...prev,
                rekapLive: [...prev.rekapLive, newRekap]
            }));

            const matchedHostName = data.hosts.find(h => h.id === hostId)?.nama_host || 'Host';
            showNotification(`✓ Sukses Buat: Rekap live disetujui otomatis untuk ${matchedHostName}!`);
        } catch (err: any) {
            showNotification("Gagal membuat rekap baru: " + err.message, true);
        } finally {
            setLoading(false);
        }
    };

    // Delete a host rekap report that is determined to be a Ghost Input / Excess Submission
    const handleDeleteRekap = async (rekapId: string) => {
        if (!window.confirm("Hapus rekap live host ini karena terbukti fiktif / tidak ada di platform siaran asli?")) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('rekap_live').delete().eq('id', rekapId);
            if (error) throw error;
            
            setData(prev => ({
                ...prev,
                rekapLive: prev.rekapLive.filter(r => r.id !== rekapId)
            }));
            showNotification("✓ Sukses Hapus: Laporan rekap fiktif host berhasil dihapus dari database!");
        } catch (err: any) {
            showNotification("Gagal menghapus rekap: " + err.message, true);
        } finally {
            setLoading(false);
        }
    };



    // File Drag & Drop Handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && (file.name.endsWith('.csv') || file.name.endsWith('.txt') || file.name.endsWith('.tsv'))) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                setCsvText(text);
                showNotification("File berhasil dimuat! Klik tombol 'Import & Audit Sekarang' di bawah.");
            };
            reader.readAsText(file);
        } else {
            showNotification("Ekstensi file tidak didukung. Mohon gunakan file CSV (.csv) atau TSV (.txt/.tsv).", true);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                setCsvText(text);
                showNotification("File dimuat! Silakan klik 'Import & Audit Sekarang'.");
            };
            reader.readAsText(file);
        }
    };

    const sortedAuditResults = [...auditResults].sort((a, b) => {
        if (sortBy === 'date-desc') {
            return new Date(b.platformData.start_time).getTime() - new Date(a.platformData.start_time).getTime();
        }
        if (sortBy === 'date-asc') {
            return new Date(a.platformData.start_time).getTime() - new Date(b.platformData.start_time).getTime();
        }
        if (sortBy === 'diamonds-desc') {
            return b.platformData.diamonds - a.platformData.diamonds;
        }
        if (sortBy === 'diamonds-asc') {
            return a.platformData.diamonds - b.platformData.diamonds;
        }
        if (sortBy === 'username-asc') {
            return a.platformData.username.localeCompare(b.platformData.username);
        }
        return 0;
    });

    const sortedVerificationResults = [...hostVerificationResults].sort((a, b) => {
        if (sortBy === 'date-desc') {
            return new Date(b.rekap.tanggal_live + 'T' + (b.rekap.waktu_mulai || '00:00')).getTime() - 
                   new Date(a.rekap.tanggal_live + 'T' + (a.rekap.waktu_mulai || '00:00')).getTime();
        }
        if (sortBy === 'date-asc') {
            return new Date(a.rekap.tanggal_live + 'T' + (a.rekap.waktu_mulai || '00:00')).getTime() - 
                   new Date(b.rekap.tanggal_live + 'T' + (b.rekap.waktu_mulai || '00:00')).getTime();
        }
        if (sortBy === 'diamonds-desc') {
            return b.rekap.pendapatan - a.rekap.pendapatan;
        }
        if (sortBy === 'diamonds-asc') {
            return a.rekap.pendapatan - b.rekap.pendapatan;
        }
        if (sortBy === 'username-asc') {
            const nameA = a.matchedHost?.nama_host || '';
            const nameB = b.matchedHost?.nama_host || '';
            return nameA.localeCompare(nameB);
        }
        return 0;
    });

    return (
        <div className="space-y-6">
            
            {/* SPEED LINES TOP */}
            <div className="relative p-6 bg-white dark:bg-stone-900 border-[3px] border-stone-900 dark:border-stone-100 rounded-3xl shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#fff] overflow-hidden">
                <div className="absolute inset-0 manga-screentone pointer-events-none opacity-[0.08] dark:opacity-[0.15]"></div>
                <div className="absolute inset-x-0 top-0 h-16 manga-speed-lines pointer-events-none opacity-20"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3.5 bg-cyan-100 dark:bg-cyan-950 border-2 border-stone-900 dark:border-stone-100 rounded-2xl shadow-[3px_3px_0px_#ec4899] rotate-3 animate-float-slow shrink-0">
                            <FileCheck className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <div>
                            <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-pink-500 text-white rounded border border-stone-900 shadow-[1px_1px_0px_#000] inline-block -rotate-1">Superadmin Only</span>
                            <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 dark:text-white uppercase bangers-font mt-1">Audit Rekap Live Host</h1>
                            <p className="text-xs font-bold text-stone-500 dark:text-stone-400 mt-1">Impor data siaran dari platform live dan audit silang terhadap data klaim host secara real-time! 🔎📊</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* UPPER PANEL: IMPORT PANEL (SPLIT LAYOUT) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 1. IMPOR DATA platform (Uploader Card) */}
                <div className="lg:col-span-8 bg-white dark:bg-stone-900 p-6 border-[3px] border-stone-900 dark:border-stone-100 rounded-2xl shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] relative overflow-hidden flex flex-col justify-between">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b-2 border-stone-100 dark:border-stone-800 pb-3">
                            <Upload className="h-5 w-5 text-pink-500" />
                            <h2 className="text-lg font-black uppercase text-stone-900 dark:text-white tracking-wide">Unggah Laporan Live Platform</h2>
                        </div>
                        
                        <p className="text-xs font-bold text-stone-500 dark:text-stone-400 leading-relaxed">
                            Seret file laporan CSV/TSV platform Senpai ke dalam area kotak di bawah, ATAU block baris data di Excel, tekan <kbd className="px-1 py-0.5 border bg-stone-100 dark:bg-stone-800 rounded font-mono text-[10px]">Ctrl+C</kbd>, lalu paste langsung di kolom teks di bawah!
                        </p>

                        {/* DRAG AND DROP AREA */}
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`border-3 border-dashed rounded-2xl p-6 text-center transition-all duration-200 flex flex-col items-center justify-center cursor-pointer ${
                                isDragOver 
                                    ? 'border-pink-500 bg-pink-500/5 dark:border-cyan-400 dark:bg-cyan-400/5 scale-[0.99]' 
                                    : 'border-stone-300 hover:border-pink-500 dark:border-stone-700 dark:hover:border-cyan-400'
                            }`}
                            onClick={() => document.getElementById('csv-file-input')?.click()}
                        >
                            <input 
                                id="csv-file-input" 
                                type="file" 
                                accept=".csv,.txt,.tsv" 
                                onChange={handleFileSelect} 
                                className="hidden" 
                            />
                            <Upload className="h-10 w-10 text-stone-400 dark:text-stone-600 mb-2 animate-bounce" />
                            <span className="block text-xs font-black text-stone-800 dark:text-stone-250">Drop file CSV Laporan Live di sini, atau Klik untuk memilih</span>
                            <span className="block text-[10px] text-stone-400 dark:text-stone-500 mt-1">Hanya mendukung format .csv / .tsv / .txt (Tab-separated)</span>
                        </div>

                        {/* COPY-PASTE TEXTAREA */}
                        <div className="space-y-1.5">
                            <label htmlFor="csv-text-area" className="block text-[11px] font-black uppercase text-stone-700 dark:text-stone-300 tracking-wide flex items-center gap-1.5">
                                <Clipboard className="h-4 w-4 text-cyan-500" />
                                <span>Atau Paste Data Excel Di Sini:</span>
                            </label>
                            <textarea
                                id="csv-text-area"
                                value={csvText}
                                onChange={(e) => setCsvText(e.target.value)}
                                placeholder="Username&#9;Start time&#9;End time&#9;LIVE duration&#9;Diamonds&#10;nebula_play&#9;05/05/2026 16:50&#9;05/05/2026 18:51&#9;2h 0m 20s&#9;734&#10;nebula_play&#9;05/04/2026 19:00&#9;05/04/2026 23:26&#9;4h 26m 1s&#9;1087"
                                rows={4}
                                className="w-full text-xs font-bold font-mono p-3 bg-stone-50 dark:bg-stone-800 border-2 border-stone-900 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 dark:text-white"
                            ></textarea>
                        </div>
                    </div>

                    {/* ACTIONS BOTTOM */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 mt-4 border-t border-stone-100 dark:border-stone-800">
                        {/* Duplicate Data Selection */}
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <span className="text-[10px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider whitespace-nowrap">Opsi Duplikat:</span>
                            <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-xl border border-stone-250 dark:border-stone-700">
                                <button
                                    onClick={() => setDuplicateOption('skip')}
                                    className={`px-3 py-1.5 text-[10px] font-extrabold rounded-lg uppercase transition-all ${
                                        duplicateOption === 'skip'
                                            ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white border border-stone-900 dark:border-stone-700 shadow-sm'
                                            : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
                                    }`}
                                >
                                    Lewati 🚫
                                </button>
                                <button
                                    onClick={() => setDuplicateOption('overwrite')}
                                    className={`px-3 py-1.5 text-[10px] font-extrabold rounded-lg uppercase transition-all ${
                                        duplicateOption === 'overwrite'
                                            ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white border border-stone-900 dark:border-stone-700 shadow-sm'
                                            : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
                                    }`}
                                >
                                    Timpa ✏️
                                </button>
                            </div>
                        </div>

                        {/* Import Button */}
                        <button
                            onClick={handleImportText}
                            disabled={loading || isSubmitting}
                            className="w-full sm:w-auto px-5 py-3 border-2 border-stone-900 dark:border-stone-100 bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-extrabold text-xs rounded-xl shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[2px_2px_0px_#000] dark:hover:shadow-[2px_2px_0px_#fff] active:translate-y-[2px] active:translate-x-[2px] active:shadow-[1px_1px_0px_#000] transition-all flex items-center justify-center gap-2 animate-bounce [animation-duration:3.5s]"
                        >
                            <Sparkles className="h-4.5 w-4.5" />
                            <span>{loading ? "Memproses Impor..." : "Import & Audit Sekarang! 📊"}</span>
                        </button>
                    </div>
                </div>

                {/* 2. SQL DDL GUIDE / INSTRUCTION (Right Card lg:col-span-4) */}
                <div className="lg:col-span-4 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-cyan-500/10 p-6 border-[3px] border-stone-900 dark:border-stone-100 rounded-2xl shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] relative overflow-hidden flex flex-col justify-between select-none">
                    <div className="absolute inset-0 manga-screentone pointer-events-none opacity-[0.1]"></div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-purple-200 dark:border-cyan-900/20 pb-3">
                            <HelpGuideIcon className="h-5 w-5 text-purple-600 dark:text-cyan-400" />
                            <h3 className="text-sm font-black uppercase text-stone-900 dark:text-white tracking-wide">Skema Database Cloud</h3>
                        </div>

                        <p className="text-[11px] font-bold text-stone-600 dark:text-stone-400 leading-relaxed">
                            Aplikasi telah dilengkapi **auto-fallback database**. Jika tabel cloud belum ada, sistem akan menyimpannya secara lokal di LocalStorage Senpai agar dapat langsung dicoba!
                        </p>

                        <div className="space-y-1.5">
                            <span className="text-[10px] font-black uppercase text-stone-500 dark:text-stone-400 tracking-wider">DDL SQL untuk Supabase Dashboard:</span>
                            <pre className="p-3 bg-stone-950 text-emerald-400 font-mono text-[9px] border-2 border-stone-900 rounded-xl overflow-x-auto select-all max-h-[140px] scrollbar-thin">
                                {sqlDDL}
                            </pre>
                        </div>
                    </div>

                    <div className="bg-stone-950/80 dark:bg-stone-950 p-3 rounded-lg border-2 border-stone-900 dark:border-stone-800 mt-4 shadow-sm flex items-center justify-between">
                        <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Total Data Tersimpan:</span>
                        <span className="text-sm font-black text-white px-2 py-0.5 border border-white/20 rounded bg-stone-900">{platformRecords.length} Baris</span>
                    </div>
                </div>

            </div>

            {/* LOWER PANEL: AUDIT REPORT & ANOMALIES TABLES */}
            <div className="bg-white dark:bg-stone-900 border-[3px] border-stone-900 dark:border-stone-100 rounded-2xl shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] overflow-hidden">
                
                {/* Table Header */}
                <div className="p-5 border-b-2 border-stone-900 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/30 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
                    <div className="flex items-center gap-2">
                        <FileCheck className="h-5 w-5 text-cyan-500" />
                        <h2 className="text-lg font-black uppercase text-stone-900 dark:text-white tracking-wide">Hasil Audit Perbandingan Rekap Live</h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
                        {/* Sort Selector */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase text-stone-500 dark:text-stone-400 tracking-wider">Urutkan:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="px-2.5 py-1.5 text-[10px] font-extrabold bg-white dark:bg-stone-800 dark:text-white border-2 border-stone-900 dark:border-stone-700 rounded-xl focus:outline-none"
                            >
                                <option value="date-desc" className="dark:bg-stone-900 dark:text-white">📅 Terbaru</option>
                                <option value="date-asc" className="dark:bg-stone-900 dark:text-white">📅 Terlama</option>
                                <option value="diamonds-desc" className="dark:bg-stone-900 dark:text-white">💎 Diamond Tertinggi</option>
                                <option value="diamonds-asc" className="dark:bg-stone-900 dark:text-white">💎 Diamond Terendah</option>
                                <option value="username-asc" className="dark:bg-stone-900 dark:text-white">🔤 Akun / Host</option>
                            </select>
                        </div>

                        <button
                            onClick={loadPlatformData}
                            className="p-2 border-2 border-stone-900 dark:border-stone-100 bg-white dark:bg-stone-800 text-stone-900 dark:text-white hover:bg-stone-100 dark:hover:bg-stone-700 rounded-xl shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] hover:translate-y-[1px] active:translate-y-[2px]"
                            title="Segarkan data"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </button>

                        <button
                            onClick={handleClearAll}
                            disabled={platformRecords.length === 0}
                            className="px-3 py-2 border-2 border-stone-900 dark:border-stone-100 bg-red-500 text-white font-extrabold text-xs rounded-xl shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] hover:translate-y-[1px] active:translate-y-[2px] disabled:opacity-50 transition-all flex items-center gap-1.5"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Kosongkan Data</span>
                        </button>
                    </div>
                </div>

                {/* TAB SELECTOR */}
                <div className="p-4 bg-stone-50/30 dark:bg-stone-950/20 border-b-2 border-stone-900 dark:border-stone-800">
                    <div className="flex bg-stone-100 dark:bg-stone-800 p-1.5 rounded-2xl border-2 border-stone-900 dark:border-stone-700 shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff]">
                        <button
                            onClick={() => setActiveAuditTab('platform')}
                            className={`flex-1 py-3 text-xs font-black rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                                activeAuditTab === 'platform'
                                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-2 border-stone-900 dark:border-stone-100 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff]'
                                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-250'
                            }`}
                        >
                            <Upload className="h-4 w-4" />
                            <span>Audit Sesi Platform ({auditResults.length})</span>
                        </button>
                        <button
                            onClick={() => setActiveAuditTab('host')}
                            className={`flex-1 py-3 text-xs font-black rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                                activeAuditTab === 'host'
                                    ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white border-2 border-stone-900 dark:border-stone-100 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff]'
                                    : 'text-stone-500 dark:text-stone-450 hover:text-stone-800 dark:hover:text-stone-250'
                            }`}
                        >
                            <UserCheck className="h-4 w-4" />
                            <span>Verifikasi Klaim Host ({hostVerificationResults.length})</span>
                        </button>
                    </div>
                </div>

                {/* Audit Tables Content */}
                <div className="overflow-x-auto">
                    {dbLoading ? (
                        <div className="flex flex-col items-center justify-center p-12 text-stone-500 dark:text-stone-400">
                            <RefreshCw className="h-8 w-8 animate-spin text-pink-500 mb-2" />
                            <span className="text-xs font-black uppercase tracking-wider">Menghubungkan ke database dan mengaudit...</span>
                        </div>
                    ) : (activeAuditTab === 'platform' ? auditResults.length : hostVerificationResults.length) === 0 ? (
                        <div className="p-12 text-center text-stone-500 dark:text-stone-450">
                            <Clipboard className="h-12 w-12 mx-auto text-stone-300 dark:text-stone-700 mb-3 animate-float-slow" />
                            <span className="block text-sm font-black uppercase tracking-wider">
                                {activeAuditTab === 'platform' 
                                    ? "Belum Ada Laporan Live Platform Terdaftar" 
                                    : "Belum Ada Klaim Laporan Host yang Relevan"}
                            </span>
                            <span className="block text-xs font-bold text-stone-400 dark:text-stone-500 mt-1">
                                {activeAuditTab === 'platform'
                                    ? "Silakan impor data platform siaran Senpai di atas menggunakan CSV/Excel copy-paste!"
                                    : "Tidak ada data rekap live host pada rentang tanggal data platform terdaftar."}
                            </span>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse select-none">
                            <thead>
                                <tr className="bg-stone-100 dark:bg-stone-950 border-b-[3px] border-stone-900 dark:border-stone-800 text-stone-900 dark:text-stone-100 text-[10px] font-black uppercase tracking-wider">
                                    {activeAuditTab === 'platform' ? (
                                        <>
                                            <th className="p-4">Akun Platform 👤</th>
                                            <th className="p-4">Tanggal & Jam Siaran 📅</th>
                                            <th className="p-4">Data Platform 🖥️</th>
                                            <th className="p-4">Data Rekap Host 📝</th>
                                            <th className="p-4">Status Hasil Audit 🚨</th>
                                            <th className="p-4 text-center">Aksi / Tindakan Penyesuaian 🛠️</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="p-4">Host & Akun TikTok 👤</th>
                                            <th className="p-4">Tanggal & Waktu Klaim 📅</th>
                                            <th className="p-4">Laporan Klaim Host 📝</th>
                                            <th className="p-4">Data Asli Platform 🖥️</th>
                                            <th className="p-4">Status Hasil Verifikasi 🚨</th>
                                            <th className="p-4 text-center">Aksi / Tindakan Penyesuaian 🛠️</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y border-stone-900 dark:divide-stone-800 font-bold text-xs">
                                {activeAuditTab === 'platform' 
                                    ? sortedAuditResults.map((audit, idx) => (
                                        <AuditRow
                                            key={idx}
                                            audit={audit}
                                            idx={idx}
                                            hosts={data.hosts}
                                            loading={loading}
                                            onAutoRevise={handleAutoRevise}
                                            onCreateMissingRekap={handleCreateMissingRekap}
                                            onDeleteRecord={handleDeleteRecord}
                                        />
                                      ))
                                    : sortedVerificationResults.map((result, idx) => (
                                        <VerificationRow
                                            key={idx}
                                            result={result}
                                            loading={loading}
                                            onAutoRevise={handleAutoRevise}
                                            onDeleteRekap={handleDeleteRekap}
                                        />
                                      ))
                                }
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

        </div>
    );
}

// Sub components/icons
function HelpGuideIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    );
}

// Audit status styles mapping
const getStatusBadgeStyle = (status: AuditResult['status']) => {
    switch (status) {
        case 'match':
            return {
                label: 'Cocok Sesuai ✓',
                Icon: CheckCircle,
                badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
            };
        case 'diff_diamonds':
            return {
                label: 'Selisih Diamond ⚠️',
                Icon: AlertTriangle,
                badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300'
            };
        case 'diff_duration':
            return {
                label: 'Selisih Durasi ⚠️',
                Icon: AlertTriangle,
                badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300'
            };
        case 'no_rekap':
            return {
                label: 'Tanpa Rekap Host 🚨',
                Icon: ShieldAlert,
                badgeClass: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
            };
        case 'unknown_account':
            return {
                label: 'Akun Belum Ditaut 🔍',
                Icon: HelpCircle,
                badgeClass: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
            };
        default:
            return {
                label: 'Unknown',
                Icon: HelpCircle,
                badgeClass: 'bg-stone-100 text-stone-700'
            };
    }
};

const formatTime = (date: Date) => {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
};

const formatMinutes = (totalMinutes: number) => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return h > 0 ? `${h}j ${m}m` : `${m}m`;
};

// Sub-component for rendering each Audit row safely with its own legal state hook
interface AuditRowProps {
    audit: AuditResult;
    idx: number;
    hosts: any[];
    loading: boolean;
    onAutoRevise: (audit: AuditResult) => void;
    onCreateMissingRekap: (audit: AuditResult, hostId: string) => void;
    onDeleteRecord: (record: PlatformLiveData) => void;
}

function AuditRow({ audit, idx, hosts, loading, onAutoRevise, onCreateMissingRekap, onDeleteRecord }: AuditRowProps) {
    const dateObj = new Date(audit.platformData.start_time);
    const formattedDate = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const formattedTimeRange = `${formatTime(dateObj)} - ${formatTime(new Date(audit.platformData.end_time))}`;
    
    const statusStyle = getStatusBadgeStyle(audit.status);
    
    // Legal React state hook inside custom component!
    const [selectedHostId, setSelectedHostId] = useState(
        audit.matchedHost?.id || (hosts[0]?.id || '')
    );

    return (
        <tr className="hover:bg-pink-500/5 dark:hover:bg-cyan-400/5 transition-colors group">
            
            {/* Account Info */}
            <td className="p-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 border-2 border-stone-900 dark:border-stone-700 flex items-center justify-center text-xs font-black shadow-sm group-hover:scale-105 transition-transform">
                        {audit.platformData.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <span className="block font-black text-stone-900 dark:text-white text-xs">{audit.platformData.username}</span>
                        <span className="block text-[10px] text-stone-400 dark:text-stone-500 uppercase tracking-wider mt-0.5">
                            {audit.matchedAccount ? `ID: ${String(audit.matchedAccount.id).substring(0, 4)}...` : 'Belum Ditautkan'}
                        </span>
                    </div>
                </div>
            </td>

            {/* Live Time */}
            <td className="p-4">
                <span className="block font-extrabold text-stone-900 dark:text-stone-200 text-xs">{formattedDate}</span>
                <span className="block text-[10px] text-stone-400 dark:text-stone-500 font-mono mt-0.5">{formattedTimeRange}</span>
            </td>

            {/* Platform Data */}
            <td className="p-4 space-y-1">
                <span className="block text-[11px] font-extrabold text-stone-900 dark:text-stone-200 flex items-center gap-1">
                    🖥️ <span className="font-mono">{formatMinutes(audit.platformData.durasi_menit)}</span> ({audit.platformData.duration})
                </span>
                <span className="block text-[11px] font-black text-pink-500 dark:text-cyan-400 flex items-center gap-1 font-mono">
                    💎 {audit.platformData.diamonds.toLocaleString('id-ID')}
                </span>
            </td>

            {/* Host Rekap Claimed Data */}
            <td className="p-4">
                {audit.matchedRekap ? (
                    <div className="space-y-1">
                        <span className="block text-[11px] font-extrabold text-stone-900 dark:text-stone-200 flex items-center gap-1">
                            👤 <span className="font-extrabold text-stone-900 dark:text-white underline">{audit.matchedHost?.nama_host || 'Unknown'}</span>
                        </span>
                        <span className="block text-[10px] text-stone-500 dark:text-stone-450 flex items-center gap-1">
                            ⏱️ Claimed: <span className="font-mono">{formatMinutes(audit.matchedRekap.durasi_menit)}</span>
                        </span>
                        <span className="block text-[10px] text-stone-500 dark:text-stone-450 flex items-center gap-1 font-mono">
                            💎 Claimed: {audit.matchedRekap.pendapatan.toLocaleString('id-ID')}
                        </span>
                    </div>
                ) : (
                    <span className="text-[10px] uppercase font-black text-stone-400 dark:text-stone-500 italic">Tidak ada klaim</span>
                )}
            </td>

            {/* Audit Result Status */}
            <td className="p-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-stone-900 dark:border-stone-100 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_#000] ${statusStyle.badgeClass}`}>
                    <statusStyle.Icon className="h-3.5 w-3.5" />
                    <span>{statusStyle.label}</span>
                </span>
                {audit.differenceDetails && (
                    <span className="block text-[9px] font-black text-red-500 dark:text-red-400 mt-1 max-w-[200px] leading-relaxed">
                        {audit.differenceDetails}
                    </span>
                )}
            </td>

            {/* Action Button: Automated Revision & Forgotten Creation */}
            <td className="p-4 text-center">
                <div className="flex items-center justify-center gap-2">
                    
                    {audit.status === 'match' && (
                        <span className="text-[10px] uppercase font-black text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            <span>Laporan Sah ✓</span>
                        </span>
                    )}

                    {(audit.status === 'diff_diamonds' || audit.status === 'diff_duration') && audit.matchedRekap && (
                        <button
                            onClick={() => onAutoRevise(audit)}
                            disabled={loading}
                            className="px-3 py-1.5 border-2 border-stone-900 dark:border-stone-800 bg-yellow-400 text-stone-900 font-extrabold text-[10px] rounded-xl shadow-[2px_2px_0px_#000] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] active:translate-y-[2px] active:shadow-[0px_0px_0px_#000] transition-all flex items-center gap-1 shrink-0"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span>Revisi Otomatis 🛠️</span>
                        </button>
                    )}

                    {audit.status === 'no_rekap' && (
                        <div className="flex flex-col sm:flex-row items-center gap-2 w-full max-w-[280px]">
                            {/* Dropdown to assign correct host - Crucial for shared shift accounts! */}
                            <select
                                value={selectedHostId}
                                onChange={(e) => setSelectedHostId(e.target.value)}
                                className="px-2 py-1.5 text-[10px] font-bold bg-white dark:bg-stone-800 dark:text-white border-2 border-stone-900 dark:border-stone-700 rounded-xl focus:outline-none w-full max-w-[140px]"
                            >
                                {hosts.map(h => (
                                    <option key={h.id} value={h.id} className="dark:bg-stone-800 dark:text-white">{h.nama_host}</option>
                                ))}
                            </select>

                            <button
                                onClick={() => onCreateMissingRekap(audit, selectedHostId)}
                                disabled={loading}
                                className="px-3 py-1.5 border-2 border-stone-900 dark:border-stone-800 bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-extrabold text-[10px] rounded-xl shadow-[2px_2px_0px_#000] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] active:translate-y-[2px] active:shadow-[0px_0px_0px_#000] transition-all flex items-center gap-1 shrink-0"
                            >
                                <PlusCircle className="h-3.5 w-3.5" />
                                <span>Buat Rekap 📝</span>
                            </button>
                        </div>
                    )}

                    {audit.status === 'unknown_account' && (
                        <span className="text-[10px] uppercase font-black text-stone-400 dark:text-stone-500 flex items-center gap-1 select-none italic">
                            <HelpCircle className="h-3.5 w-3.5" />
                            <span>Hubungkan Akun TikTok ➜</span>
                        </span>
                    )}

                    {/* Delete Platform Record Fallback */}
                    <button
                        onClick={() => onDeleteRecord(audit.platformData)}
                        className="p-1.5 text-stone-400 hover:text-red-500 dark:text-stone-600 hover:dark:text-red-400 transition-colors ml-1"
                        title="Hapus data platform ini"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </td>

        </tr>
    );
}

// Sub-component for rendering each Host Verification row safely with action tools
interface VerificationRowProps {
    result: HostVerificationResult;
    loading: boolean;
    onAutoRevise: (audit: AuditResult) => void;
    onDeleteRekap: (rekapId: string) => void;
}

function VerificationRow({ result, loading, onAutoRevise, onDeleteRekap }: VerificationRowProps) {
    const { rekap, matchedAccount, matchedHost, matchedPlatform, status, differenceDetails } = result;
    const formattedDate = new Date(rekap.tanggal_live).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    
    // Status Badge mappings
    let badgeLabel = 'Unknown';
    let badgeClass = 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300';
    let StatusIcon = HelpCircle;

    if (status === 'verified') {
        badgeLabel = 'Terverifikasi Cocok ✓';
        badgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';
        StatusIcon = CheckCircle;
    } else if (status === 'mismatch') {
        badgeLabel = 'Selisih Klaim ⚠️';
        badgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300';
        StatusIcon = AlertTriangle;
    } else if (status === 'ghost') {
        badgeLabel = 'Klaim Lebih / Fiktif 🚨';
        badgeClass = 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300';
        StatusIcon = ShieldAlert;
    } else if (status === 'unknown_account') {
        badgeLabel = 'Akun Belum Ditaut 🔍';
        badgeClass = 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300';
        StatusIcon = HelpCircle;
    }

    return (
        <tr className="hover:bg-cyan-500/5 dark:hover:bg-teal-400/5 transition-colors group">
            
            {/* Host Name & TikTok */}
            <td className="p-4">
                <div>
                    <span className="block font-black text-stone-900 dark:text-white text-xs">{matchedHost?.nama_host || 'Unknown'}</span>
                    <span className="block text-[10px] text-stone-400 dark:text-stone-500 uppercase tracking-wider mt-0.5">
                        {matchedAccount ? `@${matchedAccount.username}` : 'Akun tak dikenal'}
                    </span>
                </div>
            </td>

            {/* Date & Time */}
            <td className="p-4">
                <span className="block font-extrabold text-stone-900 dark:text-stone-200 text-xs">{formattedDate}</span>
                <span className="block text-[10px] text-stone-400 dark:text-stone-500 font-mono mt-0.5">
                    {rekap.waktu_mulai || '--:--'} s/d {rekap.waktu_selesai || '--:--'}
                </span>
            </td>

            {/* Host Claim Data */}
            <td className="p-4 space-y-1">
                <span className="block text-[11px] font-extrabold text-stone-900 dark:text-stone-200 flex items-center gap-1">
                    📝 <span className="font-mono">{formatMinutes(rekap.durasi_menit)}</span>
                </span>
                <span className="block text-[11px] font-black text-pink-500 dark:text-cyan-400 flex items-center gap-1 font-mono">
                    💎 {rekap.pendapatan.toLocaleString('id-ID')}
                </span>
            </td>

            {/* Platform Real Data */}
            <td className="p-4">
                {matchedPlatform ? (
                    <div className="space-y-1">
                        <span className="block text-[11px] font-extrabold text-stone-900 dark:text-stone-200 flex items-center gap-1">
                            🖥️ <span className="font-mono">{formatMinutes(matchedPlatform.durasi_menit)}</span> ({matchedPlatform.duration})
                        </span>
                        <span className="block text-[10px] text-stone-500 dark:text-stone-450 flex items-center gap-1 font-mono">
                            💎 {matchedPlatform.diamonds.toLocaleString('id-ID')}
                        </span>
                    </div>
                ) : (
                    <span className="text-[10px] uppercase font-black text-red-500 dark:text-red-400 italic">Tidak ada sesi di platform</span>
                )}
            </td>

            {/* Status */}
            <td className="p-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-stone-900 dark:border-stone-100 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_#000] ${badgeClass}`}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    <span>{badgeLabel}</span>
                </span>
                {differenceDetails && (
                    <span className="block text-[9px] font-black text-red-500 dark:text-red-400 mt-1 max-w-[200px] leading-relaxed">
                        {differenceDetails}
                    </span>
                )}
            </td>

            {/* Action */}
            <td className="p-4 text-center">
                <div className="flex items-center justify-center gap-2">
                    {status === 'verified' && (
                        <span className="text-[10px] uppercase font-black text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            <span>Laporan Sah ✓</span>
                        </span>
                    )}

                    {status === 'mismatch' && matchedPlatform && (
                        <button
                            onClick={() => {
                                onAutoRevise({
                                    platformData: matchedPlatform,
                                    matchedAccount,
                                    matchedHost,
                                    matchedRekap: rekap,
                                    status: 'diff_diamonds'
                                });
                            }}
                            disabled={loading}
                            className="px-3 py-1.5 border-2 border-stone-900 dark:border-stone-800 bg-yellow-400 text-stone-900 font-extrabold text-[10px] rounded-xl shadow-[2px_2px_0px_#000] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] active:translate-y-[2px] active:shadow-[0px_0px_0px_#000] transition-all flex items-center gap-1 shrink-0"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span>Revisi Otomatis 🛠️</span>
                        </button>
                    )}

                    {status === 'ghost' && (
                        <button
                            onClick={() => onDeleteRekap(rekap.id)}
                            disabled={loading}
                            className="px-3 py-1.5 border-2 border-stone-900 dark:border-stone-800 bg-red-500 text-white font-extrabold text-[10px] rounded-xl shadow-[2px_2px_0px_#000] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] active:translate-y-[2px] active:shadow-[0px_0px_0px_#000] transition-all flex items-center gap-1.5 shrink-0"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Hapus Rekap Fiktif 🚨</span>
                        </button>
                    )}

                    {status === 'unknown_account' && (
                        <span className="text-[10px] uppercase font-black text-stone-400 dark:text-stone-500 select-none italic">
                            Belum Ditautkan
                        </span>
                    )}
                </div>
            </td>
        </tr>
    );
}

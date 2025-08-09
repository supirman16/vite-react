import { useMemo } from 'react';

type DateRange = 'all' | 'today' | '7d' | 'thisMonth' | '30d';

/**
 * Custom hook untuk memfilter data rekap live berdasarkan rentang tanggal.
 * @param rekapData - Array data rekap yang sudah disetujui (approved).
 * @param dateRange - Rentang tanggal yang dipilih ('today', '7d', dll.).
 * @returns Array data rekap yang sudah difilter.
 */
export function useFilteredRekap(rekapData: any[], dateRange: DateRange) {
  return useMemo(() => {
    if (!rekapData) return [];
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (dateRange) {
      case 'today':
        return rekapData.filter(r => new Date(r.tanggal_live).setHours(0, 0, 0, 0) === today.getTime());
      
      case '7d':
        const last7Days = new Date(today);
        last7Days.setDate(today.getDate() - 6);
        return rekapData.filter(r => new Date(r.tanggal_live) >= last7Days);
      
      case 'thisMonth':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return rekapData.filter(r => new Date(r.tanggal_live) >= startOfMonth);
      
      case '30d':
        const last30Days = new Date(today);
        last30Days.setDate(today.getDate() - 29);
        return rekapData.filter(r => new Date(r.tanggal_live) >= last30Days);
      
      case 'all':
      default:
        return rekapData;
    }
  }, [rekapData, dateRange]);
}

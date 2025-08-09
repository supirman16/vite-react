import React, { useMemo } from 'react';
import { Target } from 'lucide-react';

interface TargetProgressWidgetProps {
    host: any;
    rekapData: any[];
}

export default function TargetProgressWidget({ host, rekapData }: TargetProgressWidgetProps) {
    const target = host.monthly_diamond_target || 0;

    const currentMonthDiamonds = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return rekapData
            .filter(r => {
                const recDate = new Date(r.tanggal_live);
                return r.host_id === host.id &&
                       recDate.getMonth() === currentMonth &&
                       recDate.getFullYear() === currentYear &&
                       r.status === 'approved';
            })
            .reduce((sum, r) => sum + r.pendapatan, 0);
    }, [rekapData, host.id]);

    const progress = target > 0 ? Math.min(100, (currentMonthDiamonds / target) * 100) : 0;
    const formatDiamond = (num: number) => new Intl.NumberFormat().format(num);

    if (target === 0) {
        return (
            <div className="bg-white dark:bg-stone-800 p-6 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 text-center">
                <Target className="h-8 w-8 mx-auto text-stone-400" />
                <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">Anda belum mengatur target bulanan. Atur di halaman profil!</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-stone-800 p-6 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-semibold text-stone-800 dark:text-stone-100">Progres Target Bulanan</h3>
                <span className="text-lg font-bold unity-gradient-text">{progress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-4">
                <div 
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-4 rounded-full transition-all duration-500" 
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <div className="flex justify-between items-center mt-2 text-sm text-stone-600 dark:text-stone-300">
                <span>{formatDiamond(currentMonthDiamonds)} 💎</span>
                <span className="font-semibold">{formatDiamond(target)} 💎</span>
            </div>
        </div>
    );
}
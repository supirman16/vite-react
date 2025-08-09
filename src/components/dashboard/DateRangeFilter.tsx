import React from 'react';

type DateRange = 'all' | 'today' | '7d' | 'thisMonth' | '30d';

interface DateRangeFilterProps {
  selectedRange: DateRange;
  onSelectRange: (range: DateRange) => void;
}

export default function DateRangeFilter({ selectedRange, onSelectRange }: DateRangeFilterProps) {
    const ranges: { id: DateRange; label: string }[] = [
        { id: 'all', label: 'Semua Waktu' },
        { id: 'today', label: 'Hari Ini' },
        { id: '7d', label: '7 Hari Terakhir' },
        { id: 'thisMonth', label: 'Bulan Ini' },
        { id: '30d', label: '30 Hari Terakhir' }
    ];

    return (
        <div className="flex flex-wrap items-center gap-2 mb-6">
            {ranges.map(range => (
                <button 
                    key={range.id} 
                    onClick={() => onSelectRange(range.id)} 
                    className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                        selectedRange === range.id 
                            ? 'unity-gradient-bg text-white shadow-sm' 
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700'
                    }`}
                >
                    {range.label}
                </button>
            ))}
        </div>
    );
}
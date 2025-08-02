import React from 'react';
import { FileText, Plus } from 'lucide-react';

interface EmptyStateProps {
    icon?: React.ElementType;
    title: string;
    message: string;
    actionText?: string;
    onActionClick?: () => void;
}

// Komponen ini bertanggung jawab untuk menampilkan tampilan yang informatif
// dan menarik saat tidak ada data untuk ditampilkan.
export default function EmptyState({
    icon: Icon = FileText,
    title,
    message,
    actionText,
    onActionClick
}: EmptyStateProps) {
    return (
        <div className="text-center p-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/50">
                <Icon className="h-6 w-6 text-purple-600 dark:text-purple-400" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-stone-900 dark:text-white">{title}</h3>
            <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">{message}</p>
            {actionText && onActionClick && (
                <div className="mt-6">
                    <button
                        type="button"
                        onClick={onActionClick}
                        className="inline-flex items-center rounded-md unity-gradient-bg px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
                    >
                        <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                        {actionText}
                    </button>
                </div>
            )}
        </div>
    );
}

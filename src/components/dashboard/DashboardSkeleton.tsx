import React from 'react';
import Skeleton from '../Skeleton';

export default function DashboardSkeleton() {
    return (
        <section>
            <div className="flex items-center space-x-2 mb-6">
                <Skeleton className="h-9 w-28 rounded-lg" />
                <Skeleton className="h-9 w-24 rounded-lg" />
                <Skeleton className="h-9 w-32 rounded-lg" />
            </div>
            <Skeleton className="h-48 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
            <Skeleton className="h-96" />
            <div className="mt-8">
                <Skeleton className="h-96" />
            </div>
        </section>
    );
}
import React from 'react';

// Komponen ini menampilkan placeholder abu-abu dengan animasi denyut.
// Bisa digunakan untuk menandakan bahwa konten sedang dimuat.
export default function Skeleton({ className }: { className?: string }) {
    return (
        <div className={`bg-stone-200 dark:bg-stone-700 animate-pulse rounded-md ${className}`}></div>
    );
}

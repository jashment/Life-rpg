"use client";

interface BossAlertProps {
    onClick: () => void;
}

export default function BossAlert({ onClick }: BossAlertProps) {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-24 right-6 bg-gradient-to-r from-red-600 to-red-800 text-white w-16 h-16 rounded-full shadow-[0_0_25px_rgba(220,38,38,0.8)] animate-pulse border-2 border-red-400 z-40 flex items-center justify-center font-black text-lg">
            BOSS
        </button>
    );
}

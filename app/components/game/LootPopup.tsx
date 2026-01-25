"use client";

import { Item } from "@/app/types";

interface LootPopupProps {
    newLoot: Item;
    onClose: () => void;
}

export default function LootPopup({ newLoot, onClose }: LootPopupProps) {
    const getRarityClass = (rarity: string) => {
        switch (rarity) {
        case "LEGENDARY":
            return "text-orange-400";
        case "EPIC":
            return "text-purple-400";
        case "RARE":
            return "text-sky-400";
        default:
            return "text-gray-300";
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-gradient-to-b from-gray-900 to-black border-2 border-yellow-500/50 rounded-2xl p-6 max-w-sm w-full text-center shadow-[0_0_60px_rgba(234,179,8,0.4)] transform transition-all animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
                <h2 className="text-yellow-400 font-bold tracking-widest text-sm mb-2 animate-pulse">
                    LOOT ACQUIRED!
                </h2>
                <div className="text-7xl my-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] animate-bounce">
                    {newLoot.emoji}
                </div>
                <h3
                    className={`text-3xl font-bold mb-2 ${getRarityClass(
                        newLoot.rarity,
                    )}`}>
                    {newLoot.name}
                </h3>
                <div className="text-xs font-mono bg-gray-800 inline-block px-3 py-1 rounded-full mb-4 text-gray-400 uppercase tracking-wider">
                    {newLoot.rarity}
                </div>
                <p className="text-gray-400 italic mb-6">
                    &quot;{newLoot.description}&quot;
                </p>
                <div className="bg-gray-800/50 rounded-lg p-3 flex items-center justify-center gap-4 mb-6">
                    <span className="font-bold text-yellow-400 text-lg">
                        ⚡ {newLoot.power}
                    </span>
                    <span className="text-gray-400 text-sm capitalize">
                        {newLoot.type}
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:scale-105 text-white font-bold py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-yellow-500/30">
                    Awesome!
                </button>
            </div>
        </div>
    );
}

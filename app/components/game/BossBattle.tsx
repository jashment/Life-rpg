"use client";

import { Boss } from "@/lib/schema";
import { Swords } from "lucide-react";

interface BossBattleProps {
    activeBoss: Boss;
    bestPower: number;
    battleLog: string[];
    loading: boolean;
    onClose: () => void;
    onFight: () => void;
}

export default function BossBattle({
    activeBoss,
    bestPower,
    battleLog,
    loading,
    onClose,
    onFight,
}: BossBattleProps) {
    const isPlayerStrongEnough = bestPower >= activeBoss.defense;

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col p-4 animate-in fade-in duration-500">
            <div className="flex justify-between items-start mb-4">
                <h2 className="text-3xl font-black text-red-500 tracking-widest uppercase drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">
                    Boss Battle
                </h2>
                <button onClick={onClose} className="text-gray-500 text-3xl">
                    &times;
                </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                <div className="text-9xl animate-pulse drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                    {activeBoss.emoji || "👹"}
                </div>
                <div>
                    <h3 className="text-4xl font-bold text-white">
                        {activeBoss.name}
                    </h3>
                    <p className="text-red-400 italic mt-1">
                        &quot;{activeBoss.description}&quot;
                    </p>
                </div>

                <div className="w-full max-w-md bg-gray-900 h-8 rounded-full border-2 border-red-500/50 relative overflow-hidden shadow-lg">
                    <div
                        className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-500"
                        style={{
                            width: `${(activeBoss.hp / activeBoss.maxHp) * 100}%`,
                        }}/>
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white drop-shadow-md tracking-wider">
                        {activeBoss.hp} / {activeBoss.maxHp} HP
                    </div>
                </div>

                <div className="w-full max-w-md bg-gray-900/50 p-3 rounded-lg h-36 overflow-y-auto text-sm space-y-2 border border-gray-800 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                    {battleLog.length === 0 ? (
                        <p className="text-gray-500 text-center italic pt-10">
                            The beast awaits your move...
                        </p>
                    ) : (
                        battleLog.map((log, i) => (
                            <p
                                key={i}
                                className="text-gray-300 border-b border-gray-800/50 pb-1.5 last:border-0 animate-in fade-in">
                                {log}
                            </p>
                        ))
                    )}
                </div>
            </div>

            <div className="mt-6">
                <div className="mb-4 bg-gray-900/80 p-4 rounded-lg border border-gray-700/50 backdrop-blur-sm">
                    <div className="flex justify-between items-center text-lg">
                        <div
                            className={`flex items-center gap-2 font-bold ${isPlayerStrongEnough
                                ? "text-green-400"
                                : "text-red-500 animate-pulse"
                            }`}>
                            <span>⚡</span>
                            <span>{bestPower}</span>
                            <span className="text-sm text-gray-400 font-normal">
                                Your Power
                            </span>
                        </div>
                        <div className="font-bold text-white flex items-center gap-2">
                            <span>🛡️</span>
                            <span>{activeBoss.defense}</span>
                            <span className="text-sm text-gray-400 font-normal">
                                Boss Defense
                            </span>
                        </div>
                    </div>
                    {!isPlayerStrongEnough && (
                        <p className="text-red-400 text-xs mt-3 text-center font-semibold">
                            ⚠️ You are too weak! Find better loot before fighting.
                        </p>
                    )}
                </div>
                <button
                    onClick={onFight}
                    disabled={loading || !isPlayerStrongEnough}
                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-red-700 to-red-600 text-white font-black text-xl py-5 rounded-2xl shadow-[0_0_40px_rgba(220,38,38,0.5)] border-t-2 border-red-500/50 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none disabled:from-gray-700 disabled:to-gray-600">
                    {loading ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    ) : (
                        <Swords size={24} />
                    )}
                    {loading ? "ATTACKING..." : "ATTACK"}
                </button>
            </div>
        </div>
    );
}

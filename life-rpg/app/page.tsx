'use client'
import { useState, useEffect } from 'react';
import { processLog } from './actions';
import { Achievement } from './types';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
        const [log, setLog] = useState('');
        const [achievements, setAchievements] = useState<Achievement[]>([]);
        const [loading, setLoading] = useState(false);

        // 1. Load data from phone storage on startup
        useEffect(() => {
                const saved = localStorage.getItem('rpg_achievements');
                if (saved) {
                        try {
                                setAchievements(JSON.parse(saved));
                        } catch (e) {
                                console.error("Failed to load achievements", e);
                        }
                }
        }, []);

        // 2. Save data to phone storage whenever it changes
        useEffect(() => {
                localStorage.setItem('rpg_achievements', JSON.stringify(achievements));
        }, [achievements]);

        // 3. Calculate Level and XP
        // Default to 0 if xp is missing (backward compatibility)
        const totalXP = achievements.reduce((acc, curr) => acc + ((curr.xp || 10) * curr.count), 0);
        const currentLevel = Math.floor(totalXP / 100) + 1;
        const nextLevelXP = currentLevel * 100;

        const handleLog = async () => {
                if (!log) return;
                setLoading(true);

                // Call the Server Action (AI)
                const result = await processLog(log, achievements);

                if (result.type === 'MATCH') {
                        // Logic for existing achievement
                        setAchievements(prev => prev.map(a =>
                                a.id === result.id
                                        ? { ...a, count: a.count + 1, lastEarned: new Date().toISOString() }
                                        : a
                        ));
                } else if (result.type === 'NEW') {
                        // Logic for new achievement
                        const newBadge: Achievement = {
                                id: uuidv4(),
                                title: result.newAchievement.title,
                                description: result.newAchievement.description,
                                emoji: result.newAchievement.emoji,
                                xp: result.newAchievement.xp || 10, // Fallback to 10 if AI forgets
                                count: 1,
                                lastEarned: new Date().toISOString()
                        };
                        setAchievements(prev => [newBadge, ...prev]);
                }

                setLog('');
                setLoading(false);
        };

        return (
                <main className="min-h-screen bg-black text-white p-6 max-w-md mx-auto font-sans">

                        {/* HEADER: Level & XP Display */}
                        <div className="flex justify-between items-end mb-6 border-b border-gray-800 pb-4">
                                <div>
                                        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                                                Life RPG
                                        </h1>
                                        <p className="text-gray-400 text-sm mt-1">Level {currentLevel}</p>
                                </div>
                                <div className="text-right">
                                        <div className="text-2xl font-bold text-yellow-500">{totalXP} XP</div>
                                        <div className="text-xs text-gray-500">Next Level: {nextLevelXP} XP</div>
                                </div>
                        </div>

                        {/* INPUT AREA */}
                        <div className="space-y-4 mb-8">
                                <textarea
                                        value={log}
                                        onChange={e => setLog(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-700 p-4 rounded-xl text-lg focus:ring-2 focus:ring-purple-500 outline-none placeholder-gray-600"
                                        placeholder="What did you conquer today?"
                                        rows={3}
                                />
                                <button
                                        onClick={handleLog}
                                        disabled={loading}
                                        className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-xl font-bold transition-all disabled:opacity-50 active:scale-95"
                                >
                                        {loading ? "Consulting the Oracle..." : "Claim XP"}
                                </button>
                        </div>

                        {/* ACHIEVEMENT LIST */}
                        <div className="space-y-3 pb-10">
                                {achievements.length === 0 && (
                                        <div className="text-center text-gray-600 py-10 italic">
                                                Your legend begins with a single deed...
                                        </div>
                                )}

                                {achievements.map(a => (
                                        <div key={a.id} className="bg-gray-800 p-4 rounded-xl flex items-center gap-4 border border-gray-700 relative overflow-hidden shadow-lg">

                                                {/* XP Badge (Top Right) */}
                                                <div className="absolute top-0 right-0 bg-yellow-900/50 text-yellow-200 text-xs px-2 py-1 rounded-bl-lg font-mono border-b border-l border-yellow-900">
                                                        +{a.xp || 10} XP
                                                </div>

                                                {/* Emoji Icon */}
                                                <span className="text-4xl filter drop-shadow-md">{a.emoji}</span>

                                                {/* Text Content */}
                                                <div className="flex-1 min-w-0">
                                                        <h3 className="font-bold text-lg text-purple-300 truncate">{a.title}</h3>
                                                        <p className="text-sm text-gray-400 line-clamp-2">{a.description}</p>
                                                </div>

                                                {/* Level Counter (Bottom Right) */}
                                                <div className="bg-gray-900 px-3 py-1 rounded-full text-xs font-mono text-gray-500 border border-gray-800">
                                                        Lvl {a.count}
                                                </div>
                                        </div>
                                ))}
                        </div>
                </main>
        );
}

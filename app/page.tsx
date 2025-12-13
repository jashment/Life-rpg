'use client'
import { useState, useEffect } from 'react';
import { processLog, generateDailyQuests } from './actions';
import { Achievement, Quest } from './types';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
    const [quests, setQuests] = useState<Quest[]>([]);
    const [totalXP, setTotalXP] = useState(0);
    const [loading, setLoading] = useState(false);

    // Load saved data
    useEffect(() => {
        const savedQuests = localStorage.getItem('rpg_quests');
        const savedXP = localStorage.getItem('rpg_xp');

        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (savedQuests) setQuests(JSON.parse(savedQuests));
        if (savedXP) setTotalXP(parseInt(savedXP));
    }, []);

    // Save data
    useEffect(() => {
        localStorage.setItem('rpg_quests', JSON.stringify(quests));
        localStorage.setItem('rpg_xp', totalXP.toString());
    }, [quests, totalXP]);

    const handleGenerate = async () => {
        setLoading(true);
        const data = await generateDailyQuests();
        console.log(data)

        if (data.quests) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const formattedQuests = data.quests.map((q: any) => ({
                ...q,
                id: uuidv4(),
                isCompleted: false
            }));
            setQuests(formattedQuests);
        }
        setLoading(false);
    };

    const toggleQuest = (id: string, xp: number) => {
        setQuests(prev => prev.map(q => {
            if (q.id === id) {
                // If we are checking it (it was false), add XP. If unchecking, subtract.
                const newStatus = !q.isCompleted;
                if (newStatus) setTotalXP(x => x + xp);
                else setTotalXP(x => x - xp);
                return { ...q, isCompleted: newStatus };
            }
            return q;
        }));
    };

    const getCategoryColor = (type: string) => {
        switch (type) {
        case 'HEALTH': return 'bg-green-900 border-green-700 text-green-100';
        case 'CODE': return 'bg-blue-900 border-blue-700 text-blue-100';
        default: return 'bg-purple-900 border-purple-700 text-purple-100';
        }
    };

    return (
        <main className="min-h-screen bg-black text-white p-4 max-w-md mx-auto font-sans">

            {/* HEADER */}
            <div className="sticky top-0 bg-black/90 backdrop-blur-sm z-10 pb-4 border-b border-gray-800 mb-6">
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-600">
                    Quest Board
                </h1>
                <div className="flex justify-between items-center mt-2">
                    <div className="text-gray-400 text-sm">Level {Math.floor(totalXP / 100) + 1}</div>
                    <div className="text-2xl font-mono font-bold text-yellow-500">{totalXP} XP</div>
                </div>
            </div>

            {/* GENERATE BUTTON */}
            {quests.length === 0 && (
                <div className="text-center py-10">
                    <p className="text-gray-500 mb-4">A new day awaits, Hero.</p>
                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-900/50">
                        {loading ? "Summoning Quests..." : "⚔️ Generate Daily Quests"}
                    </button>
                </div>
            )}

            {/* QUEST LIST */}
            <div className="space-y-3 pb-20">
                {quests.map(q => (
                    <div
                        key={q.id}
                        onClick={() => toggleQuest(q.id, q.xp)}
                        className={`
              p-4 rounded-xl border relative transition-all duration-200 active:scale-95 cursor-pointer
              ${q.isCompleted ? 'opacity-50 grayscale bg-gray-900 border-gray-800' : getCategoryColor(q.type)}
            `}>
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className={`font-bold text-lg ${q.isCompleted ? 'line-through' : ''}`}>
                                    {q.title}
                                </h3>
                                <p className="text-sm opacity-80 mt-1">{q.task}</p>
                            </div>
                            <div className="bg-black/30 px-2 py-1 rounded text-xs font-mono whitespace-nowrap">
                                {q.isCompleted ? 'DONE' : `+${q.xp} XP`}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* RESET BUTTON (Bottom) */}
            {quests.length > 0 && (
                <button
                    onClick={() => {
                        if (confirm("Start a new day? Current quests will be lost.")) {
                            setQuests([]);
                        }
                    }}
                    className="fixed bottom-6 right-6 bg-gray-800 text-gray-400 p-3 rounded-full shadow-lg border border-gray-700">
                    🔄 New Day
                </button>
            )}

        </main>
    );
}
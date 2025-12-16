'use client'
import { useState, useEffect } from 'react';
import { processLog, generateDailyQuests } from './actions';
import { getAchievements, saveAchievement } from './achievement-actions';
import { Achievement, Quest } from './types';
import { v4 as uuidv4 } from 'uuid';

function calculateLevel(xp: number): { level: number; currentXP: number; xpForNextLevel: number } {
    let level = 1;
    let xpRemaining = xp;
    let xpNeeded = 100;
    
    while (xpRemaining >= xpNeeded) {
        xpRemaining -= xpNeeded;
        level++;
        xpNeeded = Math.floor(100 * Math.pow(1.5, level - 1));
    }
    
    return { level, currentXP: xpRemaining, xpForNextLevel: xpNeeded };
}

export default function Home() {
    const [quests, setQuests] = useState<Quest[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [totalXP, setTotalXP] = useState(0);
    const [loading, setLoading] = useState(false);
    const [showAchievements, setShowAchievements] = useState(false);
    
    const levelInfo = calculateLevel(totalXP);

    useEffect(() => {
        const savedQuests = localStorage.getItem('rpg_quests');
        const savedXP = localStorage.getItem('rpg_xp');

        if (savedQuests) setQuests(JSON.parse(savedQuests));
        if (savedXP) setTotalXP(parseInt(savedXP));

        getAchievements().then(setAchievements);
    }, []);

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

    const toggleQuest = async (id: string, xp: number, quest: Quest) => {
        const wasCompleted = quest.isCompleted;
        const newStatus = !wasCompleted;
        
        if (newStatus) {
            setTotalXP(x => x + xp);
        } else {
            setTotalXP(x => x - xp);
        }
        
        setQuests(prev => prev.map(q => {
            if (q.id === id) {
                return { ...q, isCompleted: newStatus };
            }
            return q;
        }));

        if (newStatus) {
            const result = await processLog(quest.title + ": " + quest.task, achievements);
            if (result.type === "MATCH" && result.id) {
                const updated = await saveAchievement({
                    id: result.id,
                    title: achievements.find(a => a.id === result.id)?.title || quest.title,
                    description: achievements.find(a => a.id === result.id)?.description || quest.task,
                    emoji: achievements.find(a => a.id === result.id)?.emoji || "⚔️",
                    xp: xp,
                });
                setAchievements(updated);
            } else if (result.type === "NEW" && result.newAchievement) {
                const updated = await saveAchievement({
                    id: uuidv4(),
                    title: result.newAchievement.title,
                    description: result.newAchievement.description,
                    emoji: result.newAchievement.emoji,
                    xp: result.newAchievement.xp || xp,
                });
                setAchievements(updated);
            }
        }
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
                    <div className="text-gray-400 text-sm">Level {levelInfo.level}</div>
                    <div className="text-2xl font-mono font-bold text-yellow-500">{totalXP} XP</div>
                </div>
                <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{levelInfo.currentXP} / {levelInfo.xpForNextLevel} XP</span>
                        <span>Next level</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-300"
                            style={{ width: `${(levelInfo.currentXP / levelInfo.xpForNextLevel) * 100}%` }}
                        />
                    </div>
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
                        onClick={() => toggleQuest(q.id, q.xp, q)}
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

            {/* ACHIEVEMENTS SECTION */}
            {showAchievements && (
                <div className="fixed inset-0 bg-black/95 z-50 p-4 overflow-y-auto">
                    <div className="max-w-md mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-600">
                                Achievements
                            </h2>
                            <button
                                onClick={() => setShowAchievements(false)}
                                className="text-gray-400 text-2xl"
                            >
                                ✕
                            </button>
                        </div>
                        {achievements.length === 0 ? (
                            <p className="text-gray-500 text-center py-10">No achievements yet. Complete quests to earn them!</p>
                        ) : (
                            <div className="space-y-3">
                                {achievements.map(a => (
                                    <div key={a.id} className="p-4 rounded-xl bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-700/50">
                                        <div className="flex items-start gap-3">
                                            <span className="text-3xl">{a.emoji}</span>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-yellow-400">{a.title}</h3>
                                                <p className="text-sm text-gray-400 mt-1">{a.description}</p>
                                                <div className="flex justify-between mt-2 text-xs">
                                                    <span className="text-yellow-500">+{a.xp} XP</span>
                                                    <span className="text-gray-500">Earned {a.count}x</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* BOTTOM BUTTONS */}
            <div className="fixed bottom-6 right-6 flex gap-2">
                <button
                    onClick={() => setShowAchievements(true)}
                    className="bg-yellow-700 text-yellow-100 p-3 rounded-full shadow-lg border border-yellow-600"
                >
                    🏆
                </button>
                {quests.length > 0 && (
                    <button
                        onClick={() => {
                            if (confirm("Start a new day? Current quests will be lost.")) {
                                setQuests([]);
                            }
                        }}
                        className="bg-gray-800 text-gray-400 p-3 rounded-full shadow-lg border border-gray-700">
                        🔄
                    </button>
                )}
            </div>

        </main>
    );
}
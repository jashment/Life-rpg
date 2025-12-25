"use client";
import { useState, useEffect } from "react";
// We need the Supabase client to check who is logged in
import { supabase } from "@/lib/supabase-client"; 
import { processLog, generateDailyQuests, resetAccount } from "./actions";
import { getAchievements, saveAchievement } from "./achievement-actions";
import { saveQuestsToHistory } from "./quest-history-actions";
import { Achievement, Quest, Item } from "./types";
import { v4 as uuidv4 } from "uuid";
import { checkForLoot, getInventory } from "@/lib/item-actions";
import { checkBossSpawn, fightBoss } from "@/lib/boss-actions";
import { Boss } from "@/lib/schema"; 

// --- HELPER: Level Calc ---
function calculateLevel(xp: number): {
    level: number;
    currentXP: number;
    xpForNextLevel: number;
} {
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

function AuthForm({ onLogin }: { onLogin: () => void }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        if (isSignUp) {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) alert(error.message);
            else alert("Check your email for the confirmation link!");
        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) alert(error.message);
            else onLogin(); // Trigger parent refresh
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="w-full max-w-sm border border-gray-800 p-6 rounded-xl bg-gray-900/50">
                <h1 className="text-2xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-600">
                    Life RPG
                </h1>
                <form onSubmit={handleAuth} className="space-y-4">
                    <input 
                        type="email" placeholder="Email" required 
                        className="w-full p-3 bg-black border border-gray-700 rounded text-white"
                        value={email} onChange={e => setEmail(e.target.value)}/>
                    <input 
                        type="password" placeholder="Password" required 
                        className="w-full p-3 bg-black border border-gray-700 rounded text-white"
                        value={password} onChange={e => setPassword(e.target.value)}/>
                    <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded font-bold">
                        {loading ? "..." : (isSignUp ? "Sign Up" : "Login")}
                    </button>
                </form>
                <button 
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="w-full mt-4 text-xs text-gray-500 hover:text-white">
                    {isSignUp ? "Already have an account? Login" : "Need an account? Sign Up"}
                </button>
            </div>
        </div>
    );
}

// --- MAIN PAGE ---
export default function Home() {
    // Auth State
    const [user, setUser] = useState<any>(null);
    const [authLoading, setAuthLoading] = useState(true);

    // Game State
    const [quests, setQuests] = useState<Quest[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [totalXP, setTotalXP] = useState(0);
    const [loading, setLoading] = useState(false); // Action loading
    
    // UI State
    const [showAchievements, setShowAchievements] = useState(false);
    const [inventory, setInventory] = useState<Item[]>([]);
    const [showInventory, setShowInventory] = useState(false);
    const [newLoot, setNewLoot] = useState<Item | null>(null);
    const [activeBoss, setActiveBoss] = useState<Boss | null>(null);
    const [showBossModal, setShowBossModal] = useState(false);
    const [battleLog, setBattleLog] = useState<string[]>([]);

    const levelInfo = calculateLevel(totalXP);
    const loadGameData = async (userId: string) => {
        // Fetch specific user data from DB
        const savedAchievements = await getAchievements(userId);
        const savedInventory = await getInventory(userId);
        
        // Calculate XP from achievements (or store in DB, but this is easier for now)
        const calculatedXP = savedAchievements.reduce((sum, a) => sum + (a.xp * a.count), 0);
        
        setAchievements(savedAchievements);
        setInventory(savedInventory);
        setTotalXP(calculatedXP);

        // Check for active boss
        // We pass the calculated level to check if a boss should appear
        const currentLevel = calculateLevel(calculatedXP).level;
        const boss = await checkBossSpawn(userId, currentLevel);
        if (boss) {
            setActiveBoss(boss);
            if (boss.status === 'ALIVE') setShowBossModal(true);
        }
    };
    const checkUser = async () => {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
            setUser(data.user);
            await loadGameData(data.user.id);
        }
        setAuthLoading(false);
    };
    // 1. Initial Load: Check Login & Fetch Data
    useEffect(() => {
        checkUser();
    }, []);

    

    

    // If not logged in, show Auth Screen
    if (authLoading) return <div className="bg-black min-h-screen flex items-center justify-center text-white">Loading...</div>;
    if (!user) return <AuthForm onLogin={checkUser} />;

    // --- HANDLERS (Now using user.id) ---

    const handleGenerate = async () => {
        setLoading(true);
        // PASS USER ID
        const data = await generateDailyQuests(user.id);

        if (data && data.quests) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const formattedQuests = data.quests.map((q: any) => ({
                ...q,
                id: uuidv4(),
                isCompleted: false,
            }));
            setQuests(formattedQuests);

            // PASS USER ID
            await saveQuestsToHistory(
                user.id,
                data.quests.map((q: any) => ({
                    title: q.title,
                    task: q.task,
                    type: q.type,
                })),
            );
        }
        setLoading(false);
    };

    const toggleQuest = async (id: string, xp: number, quest: Quest) => {
        const wasCompleted = quest.isCompleted;
        const newStatus = !wasCompleted;

        // Optimistic UI Update
        if (newStatus) setTotalXP((x) => x + xp);
        else setTotalXP((x) => x - xp);

        setQuests((prev) =>
            prev.map((q) => {
                if (q.id === id) return { ...q, isCompleted: newStatus };
                return q;
            }),
        );

        if (newStatus) {
            // 1. Check for Loot (PASS USER ID)
            checkForLoot(user.id, quest.title).then((loot) => {
                if (loot) {
                    setInventory((prev) => [loot, ...prev]);
                    setNewLoot(loot);
                }
            });

            // 2. Process Achievement (PASS USER ID inside saveAchievement)
            const result = await processLog(
                quest.title + ": " + quest.task,
                achievements,
            );
            
            let updatedAchievements = achievements;

            if (result.type === "MATCH" && result.id) {
                updatedAchievements = await saveAchievement(user.id, {
                    id: result.id,
                    title: achievements.find((a) => a.id === result.id)?.title || quest.title,
                    description: achievements.find((a) => a.id === result.id)?.description || quest.task,
                    emoji: achievements.find((a) => a.id === result.id)?.emoji || "⚔️",
                    xp: xp,
                });
            } else if (result.type === "NEW" && result.newAchievement) {
                updatedAchievements = await saveAchievement(user.id, {
                    id: uuidv4(),
                    title: result.newAchievement.title,
                    description: result.newAchievement.description,
                    emoji: result.newAchievement.emoji,
                    xp: result.newAchievement.xp || xp,
                });
            }
            setAchievements(updatedAchievements);
        }
    };

    const handleFight = async () => {
        if (!activeBoss) return;
        setLoading(true);

        const bestItems = inventory.slice(0, 3).map((i) => i.id);

        const result = await fightBoss(user.id, activeBoss.uniqueId, bestItems);
            
        if (!result || typeof result.remainingHp !== 'number') {
            alert("Something went wrong with the battle.");
            setLoading(false);
            return;
        }

        if (result?.log) {
            setBattleLog((prev) => [result.log, ...prev]);
        }

        if (result?.newStatus === "DEFEATED") {
            alert(`VICTORY! You defeated ${activeBoss.name}!`);
            setActiveBoss(null);
            setShowBossModal(false);
        } else {
            setActiveBoss((prev) =>
                prev ? { ...prev, hp: result.remainingHp } : null,
            );
        }
        setLoading(false);
    };

    const handleReset = async () => {
        if (confirm("HARD RESET: Are you sure? This will wipe your Level, Items, and History.")) {
            // PASS USER ID
            await resetAccount(user.id);
            window.location.reload(); 
        }
    };

    const getCategoryColor = (type: string) => {
        switch (type) {
        case "HEALTH": return "bg-green-900 border-green-700 text-green-100";
        case "CODE": return "bg-blue-900 border-blue-700 text-blue-100";
        default: return "bg-purple-900 border-purple-700 text-purple-100";
        }
    };
        
    const handleLogout = async () => {
        // 1. Tell Supabase to kill the session
        await supabase.auth.signOut();
        
        // 2. Clear local state immediately
        setUser(null);
        setQuests([]);
        setAchievements([]);
        setInventory([]);
    };
        
    const bestPower = inventory
        .sort((a, b) => b.power - a.power)
        .slice(0, 3)
        .reduce((sum, i) => sum + i.power, 0);

    return (
        <main className="min-h-screen bg-black text-white p-4 max-w-md mx-auto font-sans">
            {/* HEADER */}
            <div className="sticky top-0 bg-black/90 backdrop-blur-sm z-10 pb-4 border-b border-gray-800 mb-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-600">
                        Quest Board
                    </h1>
                    <button onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }} className="text-xs text-gray-500 hover:text-white">
                        Logout
                    </button>
                </div>
                
                <div className="flex justify-between items-center mt-2">
                    <div className="text-gray-400 text-sm">
                        Level {levelInfo.level}
                    </div>
                    <div className="text-2xl font-mono font-bold text-yellow-500">
                        {totalXP} XP
                    </div>
                </div>
                <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>
                            {levelInfo.currentXP} / {levelInfo.xpForNextLevel}{" "}
                            XP
                        </span>
                        <span>Next level</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-300"
                            style={{
                                width: `${(levelInfo.currentXP / levelInfo.xpForNextLevel) * 100}%`,
                            }}/>
                    </div>
                </div>
            </div>

            {/* GENERATE BUTTON */}
            {quests.length === 0 && (
                <div className="text-center py-10">
                    <p className="text-gray-500 mb-4">
                        A new day awaits, Hero.
                    </p>
                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-900/50">
                        {loading
                            ? "Summoning Quests..."
                            : "⚔️ Generate Daily Quests"}
                    </button>
                </div>
            )}

            {/* QUEST LIST */}
            <div className="space-y-3 pb-20">
                {quests.map((q) => (
                    <div
                        key={q.id}
                        onClick={() => toggleQuest(q.id, q.xp, q)}
                        className={`
              p-4 rounded-xl border relative transition-all duration-200 active:scale-95 cursor-pointer
              ${q.isCompleted ? "opacity-50 grayscale bg-gray-900 border-gray-800" : getCategoryColor(q.type)}
            `}>
                        <div className="flex justify-between items-start">
                            <div>
                                <h3
                                    className={`font-bold text-lg ${q.isCompleted ? "line-through" : ""}`}>
                                    {q.title}
                                </h3>
                                <p className="text-sm opacity-80 mt-1">
                                    {q.task}
                                </p>
                            </div>
                            <div className="bg-black/30 px-2 py-1 rounded text-xs font-mono whitespace-nowrap">
                                {q.isCompleted ? "DONE" : `+${q.xp} XP`}
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
                                className="text-gray-400 text-2xl">
                                ✕
                            </button>
                        </div>
                        {achievements.length === 0 ? (
                            <p className="text-gray-500 text-center py-10">
                                No achievements yet. Complete quests to earn
                                them!
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {achievements.map((a) => (
                                    <div
                                        key={a.id}
                                        className="p-4 rounded-xl bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-700/50">
                                        <div className="flex items-start gap-3">
                                            <span className="text-3xl">
                                                {a.emoji}
                                            </span>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-yellow-400">
                                                    {a.title}
                                                </h3>
                                                <p className="text-sm text-gray-400 mt-1">
                                                    {a.description}
                                                </p>
                                                <div className="flex justify-between mt-2 text-xs">
                                                    <span className="text-yellow-500">
                                                        +{a.xp} XP
                                                    </span>
                                                    <span className="text-gray-500">
                                                        Earned {a.count}x
                                                    </span>
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
                    onClick={handleReset}
                    className="bg-red-900/50 text-red-500 p-3 rounded-full shadow-lg border border-red-900/50 hover:bg-red-900 hover:text-white transition-all"
                    title="Reset Character">
                    💀
                </button>
                <button
                    onClick={() => setShowInventory(true)}
                    className="bg-blue-900 text-blue-100 p-3 rounded-full shadow-lg border border-blue-700">
                    🎒
                </button>
                <button
                    onClick={() => setShowAchievements(true)}
                    className="bg-yellow-700 text-yellow-100 p-3 rounded-full shadow-lg border border-yellow-600">
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

            {/* LOOT POPUP */}
            {newLoot && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-gradient-to-b from-gray-900 to-black border-2 border-yellow-500 rounded-2xl p-6 max-w-sm w-full text-center shadow-[0_0_50px_rgba(234,179,8,0.3)]">
                        <h2 className="text-yellow-500 font-bold tracking-widest text-sm mb-2 animate-pulse">
                            LOOT DROPPED!
                        </h2>
                        <div className="text-6xl mb-4 animate-bounce">
                            {newLoot.emoji}
                        </div>
                        <h3
                            className={`text-2xl font-bold mb-2 ${
                                newLoot.rarity === "LEGENDARY"
                                    ? "text-orange-500"
                                    : newLoot.rarity === "EPIC"
                                        ? "text-purple-500"
                                        : newLoot.rarity === "RARE"
                                            ? "text-blue-400"
                                            : "text-gray-300"
                            }`}>
                            {newLoot.name}
                        </h3>
                        <div className="text-xs font-mono bg-gray-800 inline-block px-2 py-1 rounded mb-4 text-gray-400 uppercase">
                            {newLoot.rarity} {newLoot.type}
                        </div>
                        <p className="text-gray-400 italic mb-6">
                            &quot;{newLoot.description}&quot;
                        </p>
                        <button
                            onClick={() => setNewLoot(null)}
                            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 rounded-xl transition-all">
                            Collect
                        </button>
                    </div>
                </div>
            )}

            {/* INVENTORY MODAL */}
            {showInventory && (
                <div className="fixed inset-0 bg-black/95 z-50 p-4 overflow-y-auto">
                    <div className="max-w-md mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                                Inventory ({inventory.length})
                            </h2>
                            <button
                                onClick={() => setShowInventory(false)}
                                className="text-gray-400 text-2xl">
                                ✕
                            </button>
                        </div>
                        {inventory.length === 0 ? (
                            <div className="text-center text-gray-500 py-10">
                                Your bag is empty. Complete quests to find loot!
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {inventory.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`p-3 rounded-lg border bg-gray-900/50 flex flex-col items-center text-center gap-2
                                        ${
                                    item.rarity === "LEGENDARY"
                                        ? "border-orange-500/50 shadow-orange-900/20"
                                        : item.rarity === "EPIC"
                                            ? "border-purple-500/50"
                                            : item.rarity === "RARE"
                                                ? "border-blue-500/50"
                                                : "border-gray-800"
                                    }`}>
                                        <div className="text-3xl">
                                            {item.emoji}
                                        </div>
                                        <div className="text-sm font-bold truncate w-full">
                                            {item.name}
                                        </div>
                                        <div
                                            className={`text-[10px] uppercase font-mono ${
                                                item.rarity === "LEGENDARY"
                                                    ? "text-orange-400"
                                                    : item.rarity === "EPIC"
                                                        ? "text-purple-400"
                                                        : item.rarity === "RARE"
                                                            ? "text-blue-400"
                                                            : "text-gray-500"
                                            }`}>
                                            {item.rarity}
                                        </div>
                                        <div className="absolute top-2 left-2 bg-black/50 px-1 rounded text-[10px] font-bold text-yellow-500 border border-yellow-500/30">
                                            ⚡ {item.power}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* BOSS ALERT BUTTON */}
            {activeBoss && !showBossModal && (
                <button
                    onClick={() => setShowBossModal(true)}
                    className="fixed bottom-24 right-6 bg-red-600 text-white w-14 h-14 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.7)] animate-bounce border-2 border-red-900 z-40 flex items-center justify-center font-bold text-xs">
                    BOSS!
                </button>
            )}

            {/* BOSS BATTLE MODAL */}
            {showBossModal && activeBoss && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col p-4 animate-in fade-in duration-300">
                    <div className="flex justify-between items-start mb-6">
                        <h2 className="text-3xl font-black text-red-600 tracking-widest uppercase">
                            Boss Battle
                        </h2>
                        <button
                            onClick={() => setShowBossModal(false)}
                            className="text-gray-500 text-2xl">
                            ✕
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                        <div className="text-8xl animate-pulse">👹</div>
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-white">
                                {activeBoss.name}
                            </h3>
                            <p className="text-red-400 italic">
                                &quot;{activeBoss.description}&quot;
                            </p>
                        </div>

                        <div className="w-full max-w-xs bg-gray-900 h-8 rounded-full border-2 border-gray-700 relative overflow-hidden">
                            <div
                                className="h-full bg-red-600 transition-all duration-500"
                                style={{
                                    width: `${(activeBoss.hp / activeBoss.maxHp) * 100}%`,
                                }}/>
                            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-md">
                                {activeBoss.hp} / {activeBoss.maxHp} HP
                            </div>
                        </div>

                        <div className="w-full max-w-xs bg-gray-900/50 p-4 rounded-lg h-32 overflow-y-auto text-sm space-y-2 border border-gray-800">
                            {battleLog.length === 0 ? (
                                <p className="text-gray-500 text-center italic">
                                    The beast awaits your move...
                                </p>
                            ) : (
                                battleLog.map((log, i) => (
                                    <p
                                        key={i}
                                        className="text-gray-300 border-b border-gray-800 pb-1 last:border-0">
                                        {log}
                                    </p>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="mt-6">
                        <div className="mb-4 bg-gray-900 p-3 rounded-lg border border-gray-700">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-400">Your Power</span>
                                <span className="text-gray-400">Boss Defense</span>
                            </div>
                            <div className="flex justify-between font-bold text-xl">
                                <span className={bestPower >= activeBoss.defense ? "text-green-500" : "text-red-500"}>
                                    ⚡ {bestPower}
                                </span>
                                <span className="text-white">🛡️ {activeBoss.defense}</span>
                            </div>
                            {bestPower < activeBoss.defense && (
                                <p className="text-red-400 text-xs mt-2 text-center">
                                    ⚠️ You are too weak! Find better loot first.
                                </p>
                            )}
                        </div>
                        <button
                            onClick={handleFight}
                            disabled={loading}
                            className="w-full bg-red-700 hover:bg-red-600 text-white font-black text-xl py-6 rounded-2xl shadow-[0_0_30px_rgba(220,38,38,0.4)] border-t-4 border-red-500 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100">
                            {loading ? "ATTACKING..." : "⚔️ ATTACK"}
                        </button>
                        <p className="text-center text-gray-500 text-xs mt-3">
                            Attacking uses your top 3 inventory items
                            automatically.
                        </p>
                    </div>
                </div>
            )}
        </main>
    );
}
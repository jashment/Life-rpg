"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase-client";
import { resetAccount } from "./actions";
import { getAchievements } from "./achievement-actions";
import { getInventory } from "@/lib/item-actions";
import { checkBossSpawn, fightBoss } from "@/lib/boss-actions";
import { Achievement, Quest, Item, User } from "./types";
import { Boss } from "@/lib/schema";
import AuthForm from "./components/AuthForm";
import Header from "./components/Header";
import GenerateButton from "./components/GenerateButton";
import QuestList from "./components/QuestList";
import Achievements from "./components/Achievements";
import LootPopup from "./components/game/LootPopup";
import Inventory from "./components/game/Inventory";
import BossAlert from "./components/game/BossAlert";
import BossBattle from "./components/game/BossBattle";
import Hud from "./components/game/Hud";
import { calculateLevel } from "@/lib/utils";

function useGameLogic() {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [quests, setQuests] = useState<Quest[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [totalXP, setTotalXP] = useState(0);
    const [loading, setLoading] = useState(false);
    const [inventory, setInventory] = useState<Item[]>([]);
    const [activeBoss, setActiveBoss] = useState<Boss | null>(null);
    const [battleLog, setBattleLog] = useState<string[]>([]);

    const loadGameData = async (userId: string) => {
        const savedAchievements = await getAchievements(userId);
        const savedInventory = (await getInventory(userId)).sort(
            (a, b) => b.power - a.power
        );
        const calculatedXP = savedAchievements.reduce((sum, a) => sum + (a.xp * a.count), 0);
        setAchievements(savedAchievements);
        setInventory(savedInventory);
        setTotalXP(calculatedXP);

        const currentLevel = calculateLevel(calculatedXP).level;
        const boss = await checkBossSpawn(userId, currentLevel);
        if (boss) {
            setActiveBoss(boss);
            if (boss.status === 'ALIVE') {
                // Assuming you have a way to show the boss modal
            }
        }
    };

    useEffect(() => {
        const checkUser = async () => {
            const { data } = await supabase.auth.getUser();
            if (data.user) {
                setUser(data.user);
                await loadGameData(data.user.id);
            }
            setAuthLoading(false);
        };
        checkUser();
    }, []);

    const handleFight = async () => {
        if (!activeBoss || !user) return;
        setLoading(true);

        const equippedItems = inventory.filter((i) => i.equipped).map((i) => i.id);
        const result = await fightBoss(user.id, activeBoss.uniqueId, equippedItems);

        if (!result || !("remainingHp" in result)) {
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
        } else {
            setActiveBoss((prev) =>
                prev ? { ...prev, hp: result.remainingHp } : null,
            );
        }
        setLoading(false);
    };
    
    const handleReset = async () => {
        if (user && confirm("HARD RESET: Are you sure? This will wipe your Level, Items, and History.")) {
            await resetAccount(user.id);
            window.location.reload();
        }
    };
    
    const handleNewDay = () => {
        if (confirm("Start a new day? Current quests will be lost.")) {
            setQuests([]);
        }
    };
    
    const refetch = () => {
        if (user) {
            loadGameData(user.id);
        }
    };

    return {
        user,
        authLoading,
        quests,
        setQuests,
        achievements,
        setAchievements,
        totalXP,
        setTotalXP,
        loading,
        setLoading,
        inventory,
        setInventory,
        activeBoss,
        battleLog,
        handleFight,
        handleReset,
        handleNewDay,
        refetch,
        checkUser: () => {
            const check = async () => {
                const { data } = await supabase.auth.getUser();
                if (data.user) {
                    setUser(data.user);
                    await loadGameData(data.user.id);
                }
                setAuthLoading(false);
            };
            check();
        }
    };
}

// --- MAIN PAGE ---
export default function Home() {
    const {
        user,
        authLoading,
        quests,
        setQuests,
        achievements,
        setAchievements,
        totalXP,
        setTotalXP,
        loading,
        setLoading,
        inventory,
        setInventory,
        activeBoss,
        battleLog,
        handleFight,
        handleReset,
        handleNewDay,
        refetch,
        checkUser
    } = useGameLogic();
    
    const [showAchievements, setShowAchievements] = useState(false);
    const [showInventory, setShowInventory] = useState(false);
    const [newLoot, setNewLoot] = useState<Item | null>(null);
    const [showBossModal, setShowBossModal] = useState(false);

    const levelInfo = calculateLevel(totalXP);
    const bestPower = useMemo(() => {
        return inventory
            .filter((i) => i.equipped)
            .reduce((sum, i) => sum + i.power, 0);
    }, [inventory]);

    if (authLoading) {
        return (
            <div className="bg-black min-h-screen flex items-center justify-center text-white">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500"></div>
            </div>
        );
    }
    
    if (!user) return <AuthForm onLogin={checkUser} />;

    return (
        <main className="min-h-screen bg-black text-white p-4 max-w-2xl mx-auto font-sans">
            <Header levelInfo={levelInfo} totalXP={totalXP} />

            {quests.length === 0 && (
                <GenerateButton 
                    user={user} 
                    loading={loading} 
                    setLoading={setLoading} 
                    setQuests={setQuests} />
            )}

            {quests.length > 0 && (
                <QuestList 
                    user={user} 
                    achievements={achievements} 
                    quests={quests} 
                    setTotalXP={setTotalXP} 
                    setQuests={setQuests} 
                    setInventory={setInventory} 
                    setNewLoot={setNewLoot} 
                    setAchievements={setAchievements}
                    level={levelInfo.level} />
            )}

            {showAchievements && (
                <Achievements 
                    achievements={achievements} 
                    setShowAchievements={setShowAchievements} />
            )}

            <Hud 
                onReset={handleReset} 
                onShowInventory={() => setShowInventory(true)} 
                onShowAchievements={() => setShowAchievements(true)} 
                onNewDay={handleNewDay} 
                showNewDayButton={quests.length > 0}/>

            {newLoot && <LootPopup newLoot={newLoot} onClose={() => setNewLoot(null)} />}
            {showInventory && (
                <Inventory
                    inventory={inventory}
                    onClose={() => setShowInventory(false)}
                    userId={user.id}
                    refetch={refetch}/>
            )}
            
            {activeBoss && !showBossModal && (
                <BossAlert onClick={() => setShowBossModal(true)} />
            )}

            {showBossModal && activeBoss && (
                <BossBattle
                    activeBoss={activeBoss}
                    bestPower={bestPower}
                    battleLog={battleLog}
                    loading={loading}
                    onClose={() => setShowBossModal(false)}
                    onFight={handleFight}/>
            )}
        </main>
    );
}
import { checkForLoot } from "@/lib/item-actions";
import { saveAchievement } from "../achievement-actions";
import { processLog } from "../actions";
import { Achievement, Item, Quest } from "../types";
import { v4 as uuidv4 } from "uuid";
import { Dispatch, SetStateAction } from "react";

interface QuestListProps {
  user: any;
  achievements: Achievement[];
  quests: Quest[];
  setTotalXP: Dispatch<SetStateAction<number>>;
  setQuests: Dispatch<SetStateAction<Quest[]>>;
  setInventory: Dispatch<SetStateAction<Item[]>>;
  setNewLoot: Dispatch<SetStateAction<Item | null>>
  setAchievements: Dispatch<SetStateAction<Achievement[]>>;
}

const QuestList = ({ user, achievements, quests, setTotalXP, setQuests, setInventory, setNewLoot, setAchievements }: QuestListProps) => {

    const getCategoryColor = (type: string) => {
        switch (type) {
        case "HEALTH": return "bg-green-900 border-green-700 text-green-100";
        case "CODE": return "bg-blue-900 border-blue-700 text-blue-100";
        default: return "bg-purple-900 border-purple-700 text-purple-100";
        }
    };
  
    const toggleQuest = async (id: string, xp: number, quest: Quest) => {
        const wasCompleted = quest.isCompleted;
        const newStatus = !wasCompleted;

        // Optimistic UI Update
        if (newStatus) setTotalXP((x: number) => x + xp);
        else setTotalXP((x: number) => x - xp);

        setQuests((prev: any[]) =>
            prev.map((q: { id: string; }) => {
                if (q.id === id) return { ...q, isCompleted: newStatus };
                return q;
            }),
        );

        if (newStatus) {
            // 1. Check for Loot (PASS USER ID)
            checkForLoot(user.id, quest.title).then((loot) => {
                if (loot) {
                    setInventory((prev: any) => [loot, ...prev]);
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
                    title: achievements.find((a: { id: any; }) => a.id === result.id)?.title || quest.title,
                    description: achievements.find((a: { id: any; }) => a.id === result.id)?.description || quest.task,
                    emoji: achievements.find((a: { id: any; }) => a.id === result.id)?.emoji || "⚔️",
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
  
    return (
        <div className="space-y-3 pb-20">
            {quests.map((q: { id: any; xp: any; isCompleted: any; type: any; title: any; task: any; }) => (
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
    )
}

export default QuestList
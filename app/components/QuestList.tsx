import { checkForLoot } from "@/lib/item-actions";
import { saveAchievement } from "../achievement-actions";
import { processLog } from "../actions";
import { Achievement, Item, Quest, User } from "../types";
import { v4 as uuidv4 } from "uuid";
import { Dispatch, SetStateAction } from "react";
import { Heart, Code, Star } from "lucide-react";

interface QuestListProps {
    user: User;
    achievements: Achievement[];
    quests: Quest[];
    setTotalXP: Dispatch<SetStateAction<number>>;
    setQuests: Dispatch<SetStateAction<Quest[]>>;
    setInventory: Dispatch<SetStateAction<Item[]>>;
    setNewLoot: Dispatch<SetStateAction<Item | null>>;
    setAchievements: Dispatch<SetStateAction<Achievement[]>>;
    level: number;
}

const QuestList = ({
    user,
    achievements,
    quests,
    setTotalXP,
    setQuests,
    setInventory,
    setNewLoot,
    setAchievements,
    level,
}: QuestListProps) => {
    const getCategoryStyle = (type: string) => {
        switch (type) {
            case "HEALTH":
                return {
                    icon: <Heart size={16} className="text-red-400" />,
                    color: "border-red-900/50 bg-red-900/20",
                };
            case "CODE":
                return {
                    icon: <Code size={16} className="text-sky-400" />,
                    color: "border-sky-900/50 bg-sky-900/20",
                };
            default:
                return {
                    icon: <Star size={16} className="text-yellow-400" />,
                    color: "border-yellow-900/50 bg-yellow-900/20",
                };
        }
    };

    const handleAchievement = async (quest: Quest) => {
        const { title, task, xp } = quest;
        const result = await processLog(
            title + ": " + task,
            achievements,
        );

        let updatedAchievements = achievements;

        if (result.type === "MATCH" && result.id) {
            updatedAchievements = await saveAchievement(user.id, {
                id: result.id,
                title:
                    achievements.find((a) => a.id === result.id)?.title ||
                    title,
                description:
                    achievements.find((a) => a.id === result.id)
                        ?.description || task,
                emoji:
                    achievements.find((a) => a.id === result.id)?.emoji ||
                    "⚔️",
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
    };

    const toggleQuest = async (quest: Quest) => {
        const { id, xp, isCompleted, title } = quest;
        const newStatus = !isCompleted;

        if (newStatus) setTotalXP((x) => x + xp);
        else setTotalXP((x) => x - xp);

        setQuests((prev) =>
            prev.map((q) => {
                if (q.id === id) return { ...q, isCompleted: newStatus };
                return q;
            }),
        );

        if (newStatus) {
            checkForLoot(user.id, title, level).then((loot) => {
                if (loot) {
                    setInventory((prev) =>
                        [...prev, loot].sort((a, b) => b.power - a.power),
                    );
                    setNewLoot(loot);
                }
            });

            await handleAchievement(quest);
        }
    };
    const completedQuests = quests.filter((q) => q.isCompleted).length;
    const totalQuests = quests.length;
    const progress = totalQuests > 0 ? (completedQuests / totalQuests) * 100 : 0;

    return (
        <div className="space-y-3 pb-20">
            <div className="px-4">
                <div className="flex justify-between items-center mb-1 text-sm text-gray-400">
                    <span>Daily Progress</span>
                    <span>
                        {completedQuests} / {totalQuests}
                    </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2.5">
                    <div
                        className="bg-gradient-to-r from-green-400 to-blue-500 h-2.5 rounded-full"
                        style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            {quests.map(
                (q: Quest) => {
                    const { icon, color } = getCategoryStyle(q.type);
                    return (
                        <div
                            key={q.id}
                            onClick={() => toggleQuest(q)}
                            className={`p-4 rounded-xl border relative transition-all duration-300 active:scale-95 cursor-pointer backdrop-blur-sm ${q.isCompleted
                                ? "opacity-40 grayscale bg-gray-900/80 border-gray-800"
                                : `${color} hover:bg-opacity-40`
                            }`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        {icon}
                                        <h3
                                            className={`font-bold text-lg text-gray-100 ${q.isCompleted ? "line-through" : ""
                                            }`}>
                                            {q.title}
                                        </h3>
                                    </div>

                                    <p className="text-sm text-gray-400 ml-8">{q.task}</p>
                                </div>
                                <div className="bg-black/50 px-3 py-1 rounded-full text-xs font-mono whitespace-nowrap text-white">
                                    {q.isCompleted ? "DONE" : `+${q.xp} XP`}
                                </div>
                            </div>
                        </div>
                    );
                },
            )}
        </div>
    );
};
export default QuestList;
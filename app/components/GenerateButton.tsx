import { Dispatch, SetStateAction } from "react";
import { generateDailyQuests } from "../actions";
import { saveQuestsToHistory } from "../quest-history-actions";
import { v4 as uuidv4 } from "uuid";
import { Quest, User, GeneratedQuest } from "../types";
import { Wand2 } from "lucide-react";

interface ButtonProps {
    user: User;
    loading: boolean;
    setLoading: Dispatch<SetStateAction<boolean>>;
    setQuests: Dispatch<SetStateAction<Quest[]>>;
}

const GenerateButton = ({
    user,
    loading,
    setLoading,
    setQuests,
}: ButtonProps) => {
    const handleGenerate = async () => {
        setLoading(true);
        const data = await generateDailyQuests(user.id);

        if (data && "quests" in data) {
            const formattedQuests = data.quests.map((q: GeneratedQuest) => ({
                ...q,
                id: uuidv4(),
                isCompleted: false,
            }));
            setQuests(formattedQuests);

            await saveQuestsToHistory(
                user.id,
                data.quests.map((q: GeneratedQuest) => ({
                    title: q.title,
                    task: q.task,
                    type: q.type,
                })),
            );
        }
        setLoading(false);
    };

    return (
        <div className="text-center py-10 border-y-2 border-dashed border-gray-800 my-8 bg-gray-900/30 rounded-lg">
            <p className="text-gray-400 mb-2">A new day awaits, Hero.</p>
            <p className="text-gray-500 mb-6 text-sm">
                The realm needs you. What adventures will you conquer today?
            </p>
            <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full max-w-sm mx-auto bg-gradient-to-r from-purple-600 to-indigo-600 py-4 rounded-xl font-bold text-lg shadow-lg shadow-indigo-900/50 transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3">
                {loading ? (
                    <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Summoning Quests...
                    </>
                ) : (
                    <>
                        <Wand2 />
                        Generate Your Daily Quests
                    </>
                )}
            </button>
        </div>
    );
};

export default GenerateButton;
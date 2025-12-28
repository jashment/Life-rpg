import { Dispatch, SetStateAction } from "react";
import { generateDailyQuests } from "../actions";
import { saveQuestsToHistory } from "../quest-history-actions";
import { v4 as uuidv4 } from "uuid";
import { Quest } from "../types";

interface ButtonProps {
  user: any;
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>
  setQuests: Dispatch<SetStateAction<Quest[]>>;
}

const GenerateButton = ({ user, loading, setLoading, setQuests }: ButtonProps) => {
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
  
    return (
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
    )
}

export default GenerateButton
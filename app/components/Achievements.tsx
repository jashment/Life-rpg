const Achievements = ({
    achievements,
    setShowAchievements,
}: {
    achievements: {
        id: string;
        title: string;
        description: string;
        emoji: string;
        xp: number;
        count: number;
    }[];
    setShowAchievements: (show: boolean) => void;
}) => {
    return (
        <div className="fixed inset-0 bg-black/95 z-50 p-4 overflow-y-auto">
            <div className="max-w-md mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-600">
                        Achievements ({achievements.length})
                    </h2>
                    <button
                        onClick={() => setShowAchievements(false)}
                        className="text-gray-400 text-2xl">
                        ✕
                    </button>
                </div>
                {achievements.length === 0 ? (
                    <p className="text-gray-500 text-center py-10">
                        No achievements yet. Complete quests to earn them!
                    </p>
                ) : (
                    <div className="space-y-3">
                        {achievements.map((a) => (
                            <div
                                key={a.id}
                                className="p-4 rounded-xl bg-gradient-to-br from-gray-900 to-gray-800/80 border border-yellow-700/30 shadow-lg backdrop-blur-sm">
                                <div className="flex items-start gap-4">
                                    <span className="text-4xl mt-1">{a.emoji}</span>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg text-yellow-400">
                                            {a.title}
                                        </h3>
                                        <p className="text-sm text-gray-300 mt-1">
                                            {a.description}
                                        </p>
                                        <div className="flex justify-between items-center mt-3 text-xs">
                                            <span className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300 font-bold">
                                                +{a.xp} XP
                                            </span>
                                            {a.count > 1 && (
                                                <span className="text-gray-500 font-mono">
                                                    x{a.count}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Achievements;
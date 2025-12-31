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
    )
}

export default Achievements
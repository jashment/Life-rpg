"use client";

interface HudProps {
  onReset: () => void;
  onShowInventory: () => void;
  onShowAchievements: () => void;
  onNewDay: () => void;
  showNewDayButton: boolean;
}

export default function Hud({
    onReset,
    onShowInventory,
    onShowAchievements,
    onNewDay,
    showNewDayButton,
}: HudProps) {
    const buttonStyle =
    "flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all text-white border";

    return (
        <div className="fixed bottom-6 right-6 flex gap-3">
            <button
                onClick={onReset}
                className={`${buttonStyle} bg-red-900/50 border-red-900/50 hover:bg-red-800`}
                title="Reset Character">
                <span>💀</span> Reset
            </button>
            <button
                onClick={onShowInventory}
                className={`${buttonStyle} bg-sky-900/80 border-sky-700/80 backdrop-blur-sm hover:bg-sky-800`}>
                <span>🎒</span> Inv
            </button>
            <button
                onClick={onShowAchievements}
                className={`${buttonStyle} bg-yellow-800/80 border-yellow-700/80 backdrop-blur-sm hover:bg-yellow-700`}>
                <span>🏆</span> Achiev
            </button>
            {showNewDayButton && (
                <button
                    onClick={onNewDay}
                    className={`${buttonStyle} bg-slate-800/80 border-slate-700/80 backdrop-blur-sm hover:bg-slate-700`}>
                    <span>🔄</span> New Day
                </button>
            )}
        </div>
    );
}

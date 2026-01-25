import { supabase } from "@/lib/supabase-client";
import { LogOut } from "lucide-react";

interface HeaderProps {
    levelInfo: {
        level: number;
        currentXP: number;
        xpForNextLevel: number;
    };
    totalXP: number;
}

const Header = ({ levelInfo, totalXP }: HeaderProps) => {
    const progress =
        (levelInfo.currentXP / levelInfo.xpForNextLevel) * 100;

    return (
        <div className="sticky top-0 bg-black/90 backdrop-blur-sm z-10 pb-4 border-b border-gray-800 mb-8">
            <div className="flex justify-between items-center pt-4">
                <div>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                        LifeRPG
                    </h1>
                    <p className="text-sm text-gray-500">Level Up Your Life</p>
                </div>
                <button
                    onClick={async () => {
                        await supabase.auth.signOut();
                        window.location.reload();
                    }}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                    <LogOut size={14} /> Logout
                </button>
            </div>

            <div className="mt-6">
                <div className="flex justify-between items-end">
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white">
                            Level {levelInfo.level}
                        </span>
                        <span className="text-lg font-mono text-yellow-500">
                            {totalXP} XP
                        </span>
                    </div>
                    <span className="text-xs text-gray-500">
                        {levelInfo.currentXP} / {levelInfo.xpForNextLevel} to next
                    </span>
                </div>
                <div className="mt-2 h-3 bg-gray-800 rounded-full overflow-hidden border-2 border-gray-700/50">
                    <div
                        className="h-full bg-gradient-to-r from-green-400 to-teal-500 transition-all duration-300"
                        style={{
                            width: `${progress}%`,
                        }}/>
                </div>
            </div>
        </div>
    );
};

export default Header;
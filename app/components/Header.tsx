import { supabase } from "@/lib/supabase-client";

interface HeaderProps {
  levelInfo: {
    level: number;
    currentXP: number;
    xpForNextLevel: number;
  };
  totalXP: number;
}

const Header = ({ levelInfo, totalXP }: HeaderProps) => {
  
    return (
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
    )
}

export default Header
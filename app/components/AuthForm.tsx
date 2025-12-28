import { supabase } from "@/lib/supabase-client";
import { useState } from "react";

function AuthForm({ onLogin }: { onLogin: () => void }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        if (isSignUp) {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) alert(error.message);
            else alert("Check your email for the confirmation link!");
        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) alert(error.message);
            else onLogin(); // Trigger parent refresh
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="w-full max-w-sm border border-gray-800 p-6 rounded-xl bg-gray-900/50">
                <h1 className="text-2xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-600">
                    Life RPG
                </h1>
                <form onSubmit={handleAuth} className="space-y-4">
                    <input 
                        type="email" placeholder="Email" required 
                        className="w-full p-3 bg-black border border-gray-700 rounded text-white"
                        value={email} onChange={e => setEmail(e.target.value)}/>
                    <input 
                        type="password" placeholder="Password" required 
                        className="w-full p-3 bg-black border border-gray-700 rounded text-white"
                        value={password} onChange={e => setPassword(e.target.value)}/>
                    <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded font-bold">
                        {loading ? "..." : (isSignUp ? "Sign Up" : "Login")}
                    </button>
                </form>
                <button 
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="w-full mt-4 text-xs text-gray-500 hover:text-white">
                    {isSignUp ? "Already have an account? Login" : "Need an account? Sign Up"}
                </button>
            </div>
        </div>
    );
}

export default AuthForm
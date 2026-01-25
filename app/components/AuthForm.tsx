"use client";

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
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) alert(error.message);
            else onLogin(); // Trigger parent refresh
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="w-full max-w-sm border border-gray-800 p-8 rounded-2xl bg-gray-900/50 shadow-2xl shadow-purple-900/20">
                <h1 className="text-4xl font-bold mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                    LifeRPG
                </h1>
                <p className="text-center text-gray-400 mb-8">
                    {isSignUp ? "Create your account" : "Welcome back, adventurer"}
                </p>
                <form onSubmit={handleAuth} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        required
                        className="w-full p-3 bg-gray-900 border-2 border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}/>
                    <input
                        type="password"
                        placeholder="Password"
                        required
                        className="w-full p-3 bg-gray-900 border-2 border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}/>
                    <button
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 py-3 rounded-lg font-bold text-lg shadow-lg shadow-indigo-900/50 transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95 disabled:opacity-50">
                        {loading ? "..." : isSignUp ? "Sign Up" : "Login"}
                    </button>
                </form>
                <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="w-full mt-6 text-xs text-gray-500 hover:text-white transition-colors">
                    {isSignUp
                        ? "Already have an account? Login"
                        : "Need an account? Sign Up"}
                </button>
            </div>
        </div>
    );
}

export default AuthForm;
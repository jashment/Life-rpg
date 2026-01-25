import { GoogleGenerativeAI } from "@google/generative-ai";
import { Groq } from "groq-sdk";

const OLLAMA_MODEL = "llama3.2";
const OLLAMA_URL = "http://127.0.0.1:11434/api/generate";

function parseCleanJson(text: string) {
    try {
        const clean = text.replace(/```json|```/g, "").trim();
        return JSON.parse(clean);
    } catch (e) {
        console.error("JSON Parse Error on string:", text);
        throw e;
    }
}

async function callLocalOllama(prompt: string) {
    try {
        console.log("🦙 Connecting to Ollama...");
    
        const response = await fetch(OLLAMA_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: prompt + "\n\nIMPORTANT: Return ONLY valid JSON. No markdown.",
                format: "json",
                stream: false
            }),
        });

        if (!response.body) throw new Error("Ollama response has no body");

        const data = await response.json();
        return parseCleanJson(data.response);

    } catch (err) {
        console.error("\n🔥 ALL AI SERVICES FAILED.", err);
        return { type: "ERROR" };
    }
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function callGroq(prompt: string) {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are a Game Master. Return JSON only." },
                { role: "user", content: prompt }
            ],
            model: "llama-3.3-70b-versatile", // Fast and free
            response_format: { type: "json_object" }, // Enforces JSON
        });

        const content = completion.choices[0]?.message?.content || "{}";
        return JSON.parse(content);
    } catch (e) {
        console.error("Groq Failed", e);
        return { type: "ERROR" };
    }
}

export type AIResponse = {
  type: "MATCH" | "NEW" | "ERROR";
  id?: string;
  newAchievement?: {
    title: string;
    description: string;
    emoji: string;
    xp: number;
  };
  message?: string;
  name?: string;
  description?: string;
  emoji?: string;
  power?: number;
  placement?: string;
  hp?: number;
  win?: boolean;
  log?: string;
  damageDealt?: number;
  quests?: {
    title: string;
    task: string;
    xp: number;
    type: string;
  }[];
};

export async function generateAIContent(prompt: string): Promise<AIResponse> {
    console.log("🤖 Asking AI Gateway...");
    try {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) throw new Error("No Gemini Key");

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContent(prompt + "\n\nRETURN JSON ONLY.");
        const text = result.response.text();
    
        return parseCleanJson(text);

    } catch (geminiError) {
        console.warn("⚠️ Gemini failed. Switching to Tier 2 (Groq)...", geminiError);

        try {
            if (!process.env.GROQ_API_KEY) throw new Error("No Groq Key");
        
            const groqResult = await callGroq(prompt);
            if (groqResult.type === 'ERROR') throw new Error("Groq failed");
            return groqResult;

        } catch (groqError) {
            console.warn("⚠️ Groq failed. Switching to Tier 3 (Local Ollama)...", groqError);

            return await callLocalOllama(prompt);
        }
    }
}
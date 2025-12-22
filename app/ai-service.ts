import { GoogleGenerativeAI } from "@google/generative-ai";
import { Groq } from "groq-sdk"; // npm install groq-sdk

// CONFIGURATION
const OLLAMA_MODEL = "llama3.2"; // or "mistral"
const OLLAMA_URL = "http://127.0.0.1:11434/api/generate";

// Helper to clean up Markdown code blocks from AI responses
function parseCleanJson(text: string) {
    try {
    // Remove ```json and ``` wrapping
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
                stream: true, // <--- ENABLE STREAMING
            }),
        });

        if (!response.body) throw new Error("Ollama response has no body");

        // Create a reader to process the stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        process.stdout.write("🦙 Generating: "); // Start the line

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
      
            // Ollama sends multiple JSON objects in one chunk sometimes
            const lines = chunk.split("\n").filter((line) => line.trim() !== "");

            for (const line of lines) {
                try {
                    const json = JSON.parse(line);
                    if (json.response) {
                        // 1. VISUAL PROGRESS: Print the word to your terminal
                        process.stdout.write(json.response); 
            
                        // 2. ACCUMULATE: Build the final string
                        fullText += json.response; 
                    }
                    if (json.done) {
                        console.log("\n✅ Done!"); // New line when finished
                    }
                } catch (e) {
                    // Sometimes a chunk ends in the middle of a JSON line; ignore parse errors for partials
                }
            }
        }

        return parseCleanJson(fullText);

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

export async function generateAIContent(prompt: string): Promise<any> {
    console.log("🤖 Asking AI Gateway...");

    // 1. TIER 1: GEMINI (The Brain)
    try {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) throw new Error("No Gemini Key");

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // We append "Return JSON" strictly
        const result = await model.generateContent(prompt + "\n\nRETURN JSON ONLY.");
        const text = result.response.text();
    
        return parseCleanJson(text);

    } catch (geminiError) {
        console.warn("⚠️ Gemini failed. Switching to Tier 2 (Groq)...", geminiError);

        // 2. TIER 2: GROQ (The Speedster)
        try {
            if (!process.env.GROQ_API_KEY) throw new Error("No Groq Key");
        
            return await callGroq(prompt);

        } catch (groqError) {
            console.warn("⚠️ Groq failed. Switching to Tier 3 (Local Ollama)...", groqError);

            // 3. TIER 3: OLLAMA (The Bunker)
            return await callLocalOllama(prompt);
        }
    }
}
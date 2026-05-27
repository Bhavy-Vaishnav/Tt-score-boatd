import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Initialize Gemini Client Lazily/Safely
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      console.warn("GEMINI_API_KEY is not configured or left as placeholder.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// REST API for AI ping pong analytics
app.post("/api/analyze", async (req, res) => {
  try {
    const { players, matches } = req.body;

    if (!players || !Array.isArray(players) || players.length === 0) {
      return res.status(400).json({ error: "Players list is empty or invalid" });
    }

    const client = getGeminiClient();
    if (!client) {
      // Return a pleasant fallback if no API key is set
      return res.json({
        insights: "I noticed you haven't wired up the GEMINI_API_KEY in Secrets. Once added, I can analyze your micro-trends, determine match correlations, and write sassy commentary on your bedroom paddle rivalries!",
        funCommentary: "Welcome to the custom Ping Pong Arena! Play some matches, log your scores, and check back once the Gemini key is ready for some ultimate commentary.",
        sideBiasVerdict: {
          significant: false,
          explanation: "Analysis is currently offline. Please configure your GEMINI_API_KEY."
        },
        rivalries: [
          {
            players: [players[0]?.name || "Player A", players[1]?.name || "Player B"],
            headToHead: "Ready for first serve!",
            comment: "Enable the Gemini key in the top-right Settings for custom head-to-head commentaries."
          }
        ]
      });
    }

    // Prepare content data for model
    const matchesRep = matches.map((m: any) => {
      const p1 = players.find(p => p.id === m.player1Id)?.name || 'Unknown';
      const p2 = players.find(p => p.id === m.player2Id)?.name || 'Unknown';
      const winner = players.find(p => p.id === m.winnerId)?.name || 'Unknown';
      return `${p1} (${m.player1Side} side) vs ${p2} (${m.player2Side} side). Score: ${m.player1Score}-${m.player2Score}. Winner: ${winner}. Date: ${m.date}`;
    }).join("\n");

    const prompt = `You are an elite, highly humorous, and micro-detail obsessed Table Tennis Analyst and Sassy Arena Commentator.
We play table tennis in our living room/apartment.
Here is the list of our players:
${JSON.stringify(players.map(p => p.name))}

Here is our full match history:
${matchesRep || "No matches played yet."}

Analyze our match history and compile:
1. Sassy sports analyst insights detailing who is hot, who is on a cold streak, and overall skill disparities.
2. A witty, enthusiastic table tennis arena live commentary block that makes fun of our casual play, kitchen-table habits, and roommates ping-pong habits. Make it funny, engaging, and personal using player names!
3. Solve our table side dilemma: Based on the matches, does starting on the "Left" or "Right" side actually correlate with winning? Is it a statistically significant side-bias, or just superstition? Give a custom verdict.
4. Highlight major roommate head-to-head rivalries and current records.

Return the result as a raw JSON matching the requested schema. Make sure you use the players' actual names!`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insights: { 
              type: Type.STRING, 
              description: "High-level review of individual stats, streak commentary, and tactical breakdowns." 
            },
            funCommentary: { 
              type: Type.STRING, 
              description: "A funny, exciting, and friendly-roast style sportscaster commentary using player names." 
            },
            sideBiasVerdict: {
              type: Type.OBJECT,
              properties: {
                significant: { 
                  type: Type.BOOLEAN, 
                  description: "True if any player or the overall record has severe winning bias (>65% skew) on Left vs Right." 
                },
                explanation: { 
                  type: Type.STRING, 
                  description: "Friendly analytical proof looking at the win rates regarding left/right orientation." 
                }
              },
              required: ["significant", "explanation"]
            },
            rivalries: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  players: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array of exactly two player names." },
                  headToHead: { type: Type.STRING, description: "Record representation, e.g., 'Sam 4 wins - 2 wins Alex'" },
                  comment: { type: Type.STRING, description: "A witty remark about their ongoing living room rivalry." }
                },
                required: ["players", "headToHead", "comment"]
              }
            }
          },
          required: ["insights", "funCommentary", "sideBiasVerdict", "rivalries"]
        }
      }
    });

    const outputText = response.text || "{}";
    const data = JSON.parse(outputText);
    return res.json(data);

  } catch (error: any) {
    console.error("Gemini Analysis error:", error);
    return res.status(500).json({ 
      error: "Failed to perform AI analysis", 
      details: error.message 
    });
  }
});

// Configure Dev or Prod server
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode with Vite Dev Server Middleware
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Dev environment: Vite Middleware loaded.");
  } else {
    // Production mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production environment: Static directories loaded.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Table Tennis Tracker server active on http://0.0.0.0:${PORT}`);
  });
}

setupServer();

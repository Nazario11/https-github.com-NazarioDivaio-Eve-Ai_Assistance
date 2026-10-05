import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MODEL = process.env.OPENAI_MODEL || "gpt-6-astra";

if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY is missing from .env");
    process.exit(1);
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json());
app.use(express.static("public"));

// -----------------------------------------
// HEALTH CHECK
// -----------------------------------------

app.get("/api/health", (req, res) => {
    res.json({
        status: "online",
        model: MODEL
    });
});

// -----------------------------------------
// CHAT
// -----------------------------------------

app.post("/api/chat", async (req, res) => {

    try {

        const {
            message,
            mode = "Default Eve"
        } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                error: "Message is empty."
            });
        }

        const modeInstructions = {

            "Default Eve": `
You are Eve, a direct, rational and helpful AI assistant.
Do not blindly agree with the user.
Point out weak reasoning when appropriate.
Be honest about uncertainty.
`,

            "Tracking": `
You are Eve in Tracking Mode.

Use:
Collect → Verify → Correlate → Timeline → Assess → Report

Separate verified facts, reasonable inference, and unknown information.
`,

            "OSINT": `
You are Eve in OSINT Mode.

Analyze lawful, publicly available information.
Separate facts from inference.
Cross-check information.
Do not invent identity connections.
`,

            "Technical Tracking": `
You are Eve in Technical Tracking Mode.

Analyze public technical information such as domains,
DNS, certificates, websites, metadata and infrastructure.

Do not bypass authentication, access controls or private systems.
`,

            "Study / Lecturer": `
You are Eve in Study / Lecturer Mode.

Assume the student may have zero knowledge.
Explain concepts step by step with simple examples.
`,

            "Critical / Strategic": `
You are Eve in Critical / Strategic Mode.

Challenge assumptions.
Identify blind spots, contradictions, opportunity costs,
risks, avoidance and unrealistic expectations.
`,

            "Planning": `
You are Eve in Planning Mode.

Create realistic plans using goals, constraints,
priorities, available time and resources.
`,

            "Writing": `
You are Eve in Writing Mode.

Improve grammar, clarity, naturalness, structure and tone
while preserving the intended meaning.
`,

            "Research": `
You are Eve in Research Mode.

Use:
Question → Evidence → Cross-check → Synthesis → Uncertainty

Never present assumptions as facts.
`,

            "Safety": `
You are Eve in Safety Mode.

Prioritize privacy, risk reduction, protection and safe alternatives.
`
        };

        const instructions =
            modeInstructions[mode] ||
            modeInstructions["Default Eve"];

        const response =
            await openai.responses.create({

                model: MODEL,

                instructions: `
You are Eve.

Current mode:
${mode}

Mode instructions:
${instructions}

General rules:
- Answer the user's actual question.
- Do not invent information.
- Be clear and direct.
- State uncertainty when necessary.
`,

                input: message.trim()
            });

        res.json({

            success: true,

            reply:
                response.output_text ||
                "Eve did not return a response.",

            responseId: response.id,

            mode: mode
        });

    } catch (error) {

        console.error("");
        console.error("========== OPENAI ERROR ==========");
        console.error(error);
        console.error("==================================");

        let errorMessage =
            "The AI request failed.";

        if (error.status === 401) {
            errorMessage =
                "Invalid or unauthorized API key.";
        }

        else if (error.status === 429) {
            errorMessage =
                "API quota or rate limit reached.";
        }

        else if (error.status === 404) {
            errorMessage =
                "The selected model is unavailable.";
        }

        res.status(500).json({
            error: errorMessage
        });
    }
});

// -----------------------------------------
// START SERVER
// -----------------------------------------

app.listen(PORT, () => {

    console.log("");
    console.log("======================================");
    console.log("        EVE AI SERVER ONLINE");
    console.log("======================================");
    console.log(`URL   : http://localhost:${PORT}`);
    console.log(`MODEL : ${MODEL}`);
    console.log("======================================");
    console.log("");
});
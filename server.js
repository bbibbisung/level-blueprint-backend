import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ===== 고급형 SYSTEM PROMPT =====
const SYSTEM_PROMPT = `
You are a senior game level designer and lead designer mentor.
Your job is to generate *production-ready* level blueprints for indie / AA teams.

GOAL:
For each request, you will generate 1–10 level ideas.
Each level idea must be a "Level Blueprint" that an actual team could prototype
within 5–14 days, not a vague concept sentence.

The buyer of this tool expects:
- Professional tone and clear structure
- Practical scope for small teams
- Explicit notes that programmers / artists / QA can use
- A bit of creative flavor, but no meaningless buzzwords

OUTPUT FORMAT:
Respond in Markdown. For each level, use this structure exactly:

## Level {N}: {Short Level Title}

### 1. Level Summary
- Genre:
- Camera:
- Recommended Stage Position: (Tutorial / Early / Mid / Late / Endgame)
- Target Playtime:
- Player Fantasy: (one sentence that captures the emotional fantasy)
- Design Pillars: (2–3 short bullet points that define the core experience)

### 2. Core Objective & Failure
- Primary Objective:
- Secondary/Optional Objectives:
- Fail Conditions:

### 3. Layout & Flow
- Layout Archetype: (e.g., Linear Corridor / Hub & Spoke / Looping Route / Branching / Arena)
- Zones:
  - Zone A (Intro / Warm-up):
  - Zone B (Main Challenge):
  - Zone C (Climax / Boss / Final Push):
  - Zone D (Cool-down / Reward Area) [optional]
- Flow Steps:
  1. ...
  2. ...
  3. ...
  4. ...

### 4. Difficulty & Pacing
- Difficulty Curve: (describe Warm-up → Spike → Recovery → Climax)
- Pacing Notes: (combat/exploration/puzzle ratio, tension → release rhythm)
- Target Player Profile: (who this level is tuned for: casual / experienced / expert)

### 5. Mechanics, Enemies & Hazards
- Core Mechanics Focus: (movement, dash, parry, stealth, platforming, etc.)
- Enemy / Hazard Roles:
  - Chaser:
  - Sniper:
  - Bruiser:
  - Support / Controller:
- Environmental Gimmicks:
- Suggested Combos of Mechanics + Gimmicks:

### 6. Rewards & Optional Content
- Main Rewards:
- Optional / Secret Areas:
- Risk–Reward Notes:

### 7. Narrative & Environment
- Narrative Hook: (what story/feeling this level conveys)
- Environmental Storytelling Ideas: (props, destroyed objects, notes, signs, etc.)
- Optional Dialogue / VO Hooks: (1–3 short example lines, if relevant)

### 8. Scope & Production Notes
- Estimated Asset Requirements:
  - New Enemy Types:
  - New Gimmicks:
  - New Environment Pieces:
- Estimated Solo Dev Time: (rough days for a prototype)
- Scope Risk Notes: (what to cut first if time is short)
- Reuse Opportunities: (what can be reused from previous levels or packs)

### 9. Playtest Checklist
- Clarity:
- Fairness:
- Pacing:
- Performance / Technical:

### 10. Design Notes for Dev Team
- Tuning Tips: (how to adjust difficulty / pacing quickly)
- Implementation Risks: (what could break or take unexpectedly long)
- Recommended Prototype Order: (what to build first when time is limited)

RULES:
- Always respect the requested genre, camera type, difficulty target and focus.
- Ideas must be implementable in common engines (Unity/Unreal/Godot/RPG Maker).
- Avoid overcomplicated systems that would kill solo dev scope.
- Keep language concise but concrete: no vague buzzwords.
- When "creative direction / extra notes" are provided, align the tone, pacing and motifs with them.
`;

// 헬스 체크용
app.get("/", (req, res) => {
  res.send("Level Blueprint Backend is running");
});

// 메인 API
app.post("/api/level-blueprint", async (req, res) => {
  try {
    const {
      apiKey,          // 클라이언트가 보낸 키 (필수)
      genre,
      camera,
      stagePosition,
      playtime,
      difficulty,
      focus,
      themeKeywords,
      count,
      extraNotes
    } = req.body;

    if (!apiKey || !apiKey.trim()) {
      return res.status(400).json({
        error: "No API key provided",
        message: "Please send your OpenAI API key in the 'apiKey' field."
      });
    }

    if (!genre || !camera || !stagePosition || !playtime || !difficulty || !focus || !count) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const safeCount = Math.min(Math.max(parseInt(count, 10) || 1, 1), 10);

    const userPrompt = `
Generate ${safeCount} level blueprints.

Game context:
- Genre: ${genre}
- Camera: ${camera}
- Target stage position: ${stagePosition}
- Target playtime: ${playtime}
- Target difficulty: ${difficulty}
- Primary focus: ${focus}
- Theme / setting keywords: ${themeKeywords || "none"}

Creative direction / extra notes from the designer:
${extraNotes && extraNotes.trim().length > 0 ? extraNotes.trim() : "No additional notes."}

Constraints:
- The blueprints should be suitable for an indie or small team.
- Each level should feel distinct from the others.
- Use the output structure defined in the system prompt.
- Keep the tone professional (for internal design docs), but still readable.
`.trim();

    const apiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey.trim()}`, // ★ 항상 요청에 실린 키 사용
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2800
      })
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error("OpenAI API error:", errorText);
      return res.status(500).json({
        error: "OpenAI API error",
        detail: errorText
      });
    }

    const data = await apiResponse.json();
    const content = data.choices?.[0]?.message?.content || "";

    return res.json({ content });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

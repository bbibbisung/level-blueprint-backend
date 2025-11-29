// server.js

import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ===== 고급형 SYSTEM PROMPT (Visualizer용 Level Layout Data v1.2 버전) =====
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

### 11. Level Layout Data (for Visualizer)
After all design notes, add a machine-readable layout block for each level
using the following JSON schema, inside a fenced code block labeled \`level-json\`.

Example format (adapt this to each specific level):

\`\`\`level-json
{
  "specVersion": "1.2",
  "theme": "toy_factory",
  "flowType": "linear",

  "rooms": [
    {
      "id": "R1",
      "label": "Start Alley",
      "type": "spawn",
      "x": 0,
      "y": 0,
      "w": 4,
      "h": 3
    },
    {
      "id": "R2",
      "label": "Main Corridor Loop",
      "type": "combat",
      "x": 6,
      "y": 0,
      "w": 6,
      "h": 4
    },
    {
      "id": "R3",
      "label": "Courtyard Arena",
      "type": "boss",
      "x": 14,
      "y": 0,
      "w": 7,
      "h": 5
    }
  ],

  "connections": [
    {
      "from": "R1",
      "to": "R2",
      "type": "corridor",
      "mainPath": true
    },
    {
      "from": "R2",
      "to": "R3",
      "type": "arena_gate",
      "mainPath": true
    }
  ],

  "doors": [
    {
      "id": "D1",
      "roomId": "R1",
      "side": "east",
      "offset": 0.5,
      "kind": "standard",
      "connectsToRoomId": "R2"
    },
    {
      "id": "D2",
      "roomId": "R2",
      "side": "west",
      "offset": 0.5,
      "kind": "standard",
      "connectsToRoomId": "R1"
    },
    {
      "id": "D3",
      "roomId": "R2",
      "side": "east",
      "offset": 0.5,
      "kind": "gate",
      "connectsToRoomId": "R3"
    },
    {
      "id": "D4",
      "roomId": "R3",
      "side": "west",
      "offset": 0.5,
      "kind": "gate",
      "connectsToRoomId": "R2"
    }
  ],

  "windows": [
    {
      "id": "W1",
      "roomId": "R3",
      "side": "north",
      "offset": 0.3
    }
  ],

  "props": [
    {
      "id": "P1",
      "roomId": "R2",
      "x": 1.5,
      "y": 1.0,
      "w": 1.5,
      "h": 1.0,
      "category": "table"
    },
    {
      "id": "P2",
      "roomId": "R3",
      "x": 2.5,
      "y": 1.5,
      "w": 2.0,
      "h": 1.5,
      "category": "cover_pillar"
    }
  ],

  "enemySpawns": [
    {
      "id": "E1",
      "roomId": "R2",
      "x": 2.0,
      "y": 1.2,
      "role": "chaser"
    },
    {
      "id": "E2",
      "roomId": "R3",
      "x": 3.0,
      "y": 2.0,
      "role": "bruiser"
    }
  ]
}
\`\`\`

RULES FOR LAYOUT DATA (MANDATORY):

- Use \`"specVersion": "1.2"\` for all new layouts.

- For EVERY level you create, you MUST include:
  - at least 2 doors in the \`doors\` array,
  - at least 1 window in the \`windows\` array,
  - at least 2 props in the \`props\` array,
  - at least 2 enemySpawns in the \`enemySpawns\` array.
- Never omit these arrays and never leave them empty.

- Doors and connections must be logically consistent:

  - Each entry in \`connections\` represents a traversable path between two rooms.
  - For every connection \`{ "from": "RX", "to": "RY", ... }\` you MUST:
    - create at least one door inside room \`RX\`
      with \`"connectsToRoomId": "RY"\`, and
    - create at least one door inside room \`RY\`
      with \`"connectsToRoomId": "RX"\`.
  - Use door \`side\` and \`offset\` so that doors are placed on the wall that
    faces the connected room whenever possible
    (e.g. if R1 is west of R2, use \`east\` on R1 and \`west\` on R2).

- For \`doors\` and \`windows\`:
  - \`roomId\` must match one of the room ids.
  - \`side\` is one of: \`"north"\`, \`"south"\`, \`"east"\`, \`"west"\`.
  - \`offset\` is a number between 0.0 and 1.0, meaning position along that side.
  - \`connectsToRoomId\` (for doors) must match another room id and should
    correspond to a \`connections\` entry in the graph.

- For \`props\`:
  - \`x\` and \`y\` are in room-local grid units (0.0 ~ room.w, 0.0 ~ room.h).
  - When relevant, include \`w\` and \`h\` to represent the footprint of the prop
    (large debris, vehicles, cover walls, etc.).
  - Use small, readable values (e.g. 0.5–2.5 tiles) for \`w\` and \`h\`.

- For \`enemySpawns\`:
  - \`x\` and \`y\` are room-local coordinates in the same grid.
  - Place spawns in positions that make sense for the described encounters
    (flanking positions, pressure from behind, arena corners, etc.).

- General layout rules:
  - All level layout data MUST be valid JSON:
    - no trailing commas,
    - double quotes for all keys and string values,
    - numeric values only for coordinates.
  - Use integer grid coordinates for room \`x\`, \`y\`, \`w\`, \`h\` (small values like 0–30).
  - Place rooms so they roughly reflect the described flow and do not heavily overlap.
  - Use usually 4–10 rooms per level (can be fewer if the level is intentionally tiny).
  - \`"theme"\` should be a short token-like string that reflects the setting,
    for example: \`"toy_factory"\`, \`"abandoned_lab"\`, \`"gothic_dungeon"\`, \`"industrial_factory"\`.
  - \`"flowType"\` should match the Layout Archetype when possible:
    \`"linear"\`, \`"branching"\`, \`"looping"\`, \`"hub"\`, \`"arena"\`, \`"semilinear"\`, etc.
  - \`"type"\` for rooms should be chosen from:
    \`"spawn"\`, \`"combat"\`, \`"puzzle"\`, \`"hub"\`, \`"boss"\`, \`"treasure"\`,
    \`"corridor"\`, \`"safe"\`, \`"checkpoint"\`.

RULES:
- Always respect the requested genre, camera type, difficulty target and focus.
- Ideas must be implementable in common engines (Unity/Unreal/Godot/RPG Maker).
- Avoid overcomplicated systems that would kill solo dev scope.
- Keep language concise but concrete: no vague buzzwords.
- When "creative direction / extra notes" are provided, align the tone, pacing and motifs with them.
`;

// ===== 유틸: 숫자 보정 =====
function clampInt(value, min, max, fallback = 0) {
  if (!Number.isFinite(value)) value = fallback;
  value = Math.round(value);
  if (value < min) value = min;
  if (value > max) value = max;
  return value;
}

function clampOffset(value) {
  if (!Number.isFinite(value)) return 0.5;
  if (value < 0.1) return 0.1;
  if (value > 0.9) return 0.9;
  return value;
}

// ===== 레벨 JSON 밸리데이션 & 보정 =====
function validateAndPostProcessLevel(rawLayout) {
  // 깊은 복사(원본 파괴 방지)
  const layout = JSON.parse(JSON.stringify(rawLayout || {}));
  const warnings = [];

  layout.specVersion = "1.2";

  // --- rooms 정리 ---
  if (!Array.isArray(layout.rooms)) {
    warnings.push("rooms array was missing or invalid; initialized as empty.");
    layout.rooms = [];
  }

  const validRooms = [];
  const roomIdSet = new Set();

  for (const room of layout.rooms) {
    if (!room || typeof room !== "object") continue;
    let id = (room.id ?? "").toString().trim();
    if (!id) {
      warnings.push("A room without id was removed.");
      continue;
    }
    if (roomIdSet.has(id)) {
      warnings.push(`Duplicate room id '${id}' found; duplicate removed.`);
      continue;
    }
    roomIdSet.add(id);

    let x = clampInt(room.x, 0, 30, 0);
    let y = clampInt(room.y, 0, 30, 0);
    let w = clampInt(room.w, 1, 30, 4);
    let h = clampInt(room.h, 1, 30, 4);

    validRooms.push({
      ...room,
      id,
      x,
      y,
      w,
      h
    });
  }

  layout.rooms = validRooms;
  const roomIds = new Set(validRooms.map((r) => r.id));
  const roomMap = new Map(validRooms.map((r) => [r.id, r]));

  // --- connections 정리 ---
  if (!Array.isArray(layout.connections)) {
    if (layout.connections != null) {
      warnings.push("connections was not an array; replaced with empty array.");
    }
    layout.connections = [];
  }

  const validConnections = [];
  for (const conn of layout.connections) {
    if (!conn || typeof conn !== "object") continue;
    const from = conn.from;
    const to = conn.to;
    if (!roomIds.has(from) || !roomIds.has(to)) {
      warnings.push(
        `Connection from '${from}' to '${to}' removed (invalid room id).`
      );
      continue;
    }
    validConnections.push(conn);
  }
  layout.connections = validConnections;

  // --- 공통: 배열 보장 ---
  function ensureArrayField(fieldName) {
    if (!Array.isArray(layout[fieldName])) {
      if (layout[fieldName] != null) {
        warnings.push(`${fieldName} was not an array; replaced with empty array.`);
      }
      layout[fieldName] = [];
    }
  }

  ensureArrayField("doors");
  ensureArrayField("windows");
  ensureArrayField("props");
  ensureArrayField("enemySpawns");

  // --- doors 정리 ---
  const allowedSides = new Set(["north", "south", "east", "west"]);
  const validDoors = [];

  for (const door of layout.doors) {
    if (!door || typeof door !== "object") continue;
    const id = door.id ?? "";
    const roomId = door.roomId;

    if (!roomIds.has(roomId)) {
      warnings.push(
        `Door '${id}' dropped because roomId '${roomId}' does not exist.`
      );
      continue;
    }

    let side = (door.side || "north").toLowerCase();
    if (!allowedSides.has(side)) {
      warnings.push(
        `Door '${id}' had invalid side '${door.side}', defaulted to 'north'.`
      );
      side = "north";
    }

    const offset = clampOffset(door.offset);

    if (
      door.connectsToRoomId &&
      !roomIds.has(door.connectsToRoomId)
    ) {
      warnings.push(
        `Door '${id}' had invalid connectsToRoomId '${door.connectsToRoomId}', field removed.`
      );
      delete door.connectsToRoomId;
    }

    validDoors.push({
      ...door,
      roomId,
      side,
      offset
    });
  }
  layout.doors = validDoors;

  // --- windows 정리 ---
  const validWindows = [];
  for (const win of layout.windows) {
    if (!win || typeof win !== "object") continue;
    const id = win.id ?? "";
    const roomId = win.roomId;

    if (!roomIds.has(roomId)) {
      warnings.push(
        `Window '${id}' dropped because roomId '${roomId}' does not exist.`
      );
      continue;
    }

    let side = (win.side || "north").toLowerCase();
    if (!allowedSides.has(side)) {
      warnings.push(
        `Window '${id}' had invalid side '${win.side}', defaulted to 'north'.`
      );
      side = "north";
    }

    const offset = clampOffset(win.offset);

    validWindows.push({
      ...win,
      roomId,
      side,
      offset
    });
  }
  layout.windows = validWindows;

  // --- props 정리 ---
  const validProps = [];
  for (const prop of layout.props) {
    if (!prop || typeof prop !== "object") continue;
    const id = prop.id ?? "";
    const roomId = prop.roomId;

    const room = roomMap.get(roomId);
    if (!room) {
      warnings.push(
        `Prop '${id}' dropped because roomId '${roomId}' does not exist.`
      );
      continue;
    }

    const maxX = room.w;
    const maxY = room.h;

    let x = Number.isFinite(prop.x) ? prop.x : maxX / 2;
    let y = Number.isFinite(prop.y) ? prop.y : maxY / 2;

    if (x < 0) x = 0;
    if (x > maxX) x = maxX;
    if (y < 0) y = 0;
    if (y > maxY) y = maxY;

    let w = Number.isFinite(prop.w) ? prop.w : prop.width;
    let h = Number.isFinite(prop.h) ? prop.h : prop.height;

    if (!Number.isFinite(w) || w <= 0) w = 1.0;
    if (!Number.isFinite(h) || h <= 0) h = 1.0;

    validProps.push({
      ...prop,
      roomId,
      x,
      y,
      w,
      h
    });
  }
  layout.props = validProps;

  // --- enemySpawns 정리 ---
  const validEnemySpawns = [];
  for (const spawn of layout.enemySpawns) {
    if (!spawn || typeof spawn !== "object") continue;
    const id = spawn.id ?? "";
    const roomId = spawn.roomId;

    const room = roomMap.get(roomId);
    if (!room) {
      warnings.push(
        `Enemy spawn '${id}' dropped because roomId '${roomId}' does not exist.`
      );
      continue;
    }

    const maxX = room.w;
    const maxY = room.h;

    let x = Number.isFinite(spawn.x) ? spawn.x : maxX / 2;
    let y = Number.isFinite(spawn.y) ? spawn.y : maxY / 2;

    if (x < 0) x = 0;
    if (x > maxX) x = maxX;
    if (y < 0) y = 0;
    if (y > maxY) y = maxY;

    validEnemySpawns.push({
      ...spawn,
      roomId,
      x,
      y
    });
  }
  layout.enemySpawns = validEnemySpawns;

  // --- 그래프 도달 가능성 체크 ---
  if (validRooms.length > 0 && layout.connections.length > 0) {
    const adj = new Map();
    for (const room of validRooms) {
      adj.set(room.id, new Set());
    }
    for (const conn of layout.connections) {
      if (!adj.has(conn.from) || !adj.has(conn.to)) continue;
      adj.get(conn.from).add(conn.to);
      adj.get(conn.to).add(conn.from);
    }

    const spawnRoom =
      validRooms.find((r) => r.type === "spawn") || validRooms[0];
    const startId = spawnRoom.id;
    const visited = new Set([startId]);
    const queue = [startId];

    while (queue.length > 0) {
      const cur = queue.shift();
      const neighbors = adj.get(cur) || new Set();
      for (const n of neighbors) {
        if (!visited.has(n)) {
          visited.add(n);
          queue.push(n);
        }
      }
    }

    const isolated = [];
    for (const room of validRooms) {
      if (!visited.has(room.id)) {
        isolated.push(room.id);
        if (!Array.isArray(room.flags)) room.flags = [];
        if (!room.flags.includes("isolated")) {
          room.flags.push("isolated");
        }
      }
    }

    if (isolated.length > 0) {
      warnings.push(
        `Some rooms are unreachable from spawn/start: ${isolated.join(", ")}`
      );
    }
  }

  return { layout, warnings };
}

// ===== Markdown 안의 level-json 블록 전처리 =====
function postProcessAllLevelJsonBlocks(markdown) {
  const regex = /```level-json([\s\S]*?)```/gi;
  let match;
  let lastIndex = 0;
  let result = "";
  const allWarnings = [];

  while ((match = regex.exec(markdown)) !== null) {
    const jsonText = match[1].trim();
    result += markdown.slice(lastIndex, match.index);

    try {
      const parsed = JSON.parse(jsonText);
      const { layout, warnings } = validateAndPostProcessLevel(parsed);
      const fixedJson = JSON.stringify(layout, null, 2);
      result += "```level-json\n" + fixedJson + "\n```";
      allWarnings.push(...warnings);
    } catch (e) {
      allWarnings.push(
        `Failed to parse level-json block at index ${match.index}: ${e.message}`
      );
      // 파싱 실패 시 원본 그대로 둠
      result += match[0];
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex === 0) {
    // level-json 블록이 없는 경우
    return { content: markdown, warnings: allWarnings };
  }

  result += markdown.slice(lastIndex);
  return { content: result, warnings: allWarnings };
}

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
- For every level, you MUST also include the 'Level Layout Data (for Visualizer)'
  section at the end, with a valid \`level-json\` block that approximates a
  top-down layout of the described level, including:
  - rooms and connections,
  - AND at least a few doors, windows, props, and enemySpawns that match the gameplay.
- Never omit the \`doors\`, \`windows\`, \`props\`, or \`enemySpawns\` arrays. Each must contain data.
`.trim();

    const apiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey.trim()}`,
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
    const rawContent = data.choices?.[0]?.message?.content || "";

    // level-json 블록 전처리(밸리데이션 & 보정)
    const { content, warnings } = postProcessAllLevelJsonBlocks(rawContent);

    return res.json({ content, warnings });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Bolo Booking - agent-orchestrated voice travel demo (Paytm Checkin concept).
// The orchestrator understands each turn in context (Claude CLI under the user's own login, or the offline
// keyword parser with LLM_PROVIDER=none) and delegates to specialists: booking (train/flight/bus/hotel),
// post-booking and policy RAG. All inventory is sample data; booking and payment are mocked.
import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve, sep } from "node:path";
import { orchestrate } from "./src/orchestrator.js";
import { loadPrefs, newSession } from "./src/memory.js";

const PORT = process.env.PORT || 8787;
const ROOT = dirname(fileURLToPath(import.meta.url));
const PUBLIC = resolve(ROOT, "public");
const MAX_BODY = 8 * 1024;
const sessions = new Map(); // ponytail: in-memory and unbounded; fine for a local demo, add expiry before hosting it
const PREFS = await loadPrefs();

function send(res, status, body){
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

async function handleChat(req, res){
  let body = "";
  for await (const c of req){ body += c; if (body.length > MAX_BODY) return send(res, 413, { error: "Message too long" }); }
  let input;
  try { input = JSON.parse(body || "{}"); } catch(e){ return send(res, 400, { error: "Invalid JSON" }); }
  const message = String(input.message || "").slice(0, 500).trim();
  const sid = String(input.sessionId || "default").slice(0, 64);
  const lang = input.lang === "en" ? "en" : "hi";
  if (!message) return send(res, 400, { error: "Empty message" });
  if (!sessions.has(sid)) sessions.set(sid, newSession({ ...PREFS }));
  try {
    const out = await orchestrate(message, sessions.get(sid), lang);
    send(res, 200, { reply: out.reply || "", cards: out.cards || null, ticket: out.ticket || null, chips: out.chips || [],
      trip: out.trip || null, agent: out.agent, selected: out.selected ?? null, retrieved: out.retrieved || null, source: out.source || null,
      engine: out.engine, intent: out.intent, lang });
  } catch(e){
    console.error("chat failed:", e);
    send(res, 500, { error: lang === "en" ? "Something went wrong. Please try again." : "कुछ गड़बड़ हो गई। फिर से कोशिश कीजिए।" });
  }
}

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css",
  ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon" };
http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/api/chat" && req.method === "POST") return handleChat(req, res);
  let path;
  try { path = decodeURIComponent(url.pathname); } catch(e){ res.writeHead(400); return res.end("bad path"); } // "%zz" throws
  const file = resolve(PUBLIC, "." + (path === "/" ? "/index.html" : path));
  if (!file.startsWith(PUBLIC + sep)){ res.writeHead(403); return res.end("forbidden"); }
  try {
    const data = await readFile(file);
    res.writeHead(200, { "content-type": MIME[file.slice(file.lastIndexOf("."))] || "application/octet-stream" });
    res.end(data);
  } catch(e){ res.writeHead(404); res.end("not found"); }
}).listen(PORT, () => console.log(`Bolo Booking on http://localhost:${PORT} (LLM_PROVIDER=${process.env.LLM_PROVIDER || "claude-cli"})`));

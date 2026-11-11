// Bolo Booking v2 - agent-orchestrated voice travel demo (Paytm Checkin concept).
// Orchestrator routes each turn to a tool-specialist agent (train/flight/bus/hotel/
// post-booking/policy-RAG). LLM slot extraction via local Claude CLI behind
// LLM_PROVIDER (claude-cli default | none = offline keyword fallback). All data sample.
import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { orchestrate } from "./src/orchestrator.js";
import { loadPrefs, newSession } from "./src/memory.js";

const PORT = process.env.PORT || 8787;
const ROOT = dirname(fileURLToPath(import.meta.url));
const sessions = new Map();
const PREFS = await loadPrefs();

async function handleChat(req, res){
  let body = ""; for await (const c of req) body += c;
  const { message, sessionId } = JSON.parse(body || "{}");
  const sid = sessionId || "default";
  if (!sessions.has(sid)) sessions.set(sid, newSession({ ...PREFS }));
  const session = sessions.get(sid);
  const out = await orchestrate(message || "", session);
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ reply: out.reply || "", cards: out.cards || null, ticket: out.ticket || null,
    vertical: out.vertical, retrieved: out.retrieved || null, engine: out.nlu?.engine || "none" }));
}

const MIME = { ".html":"text/html", ".js":"text/javascript", ".css":"text/css", ".png":"image/png" };
http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/api/chat" && req.method === "POST") return handleChat(req, res);
  let p = url.pathname === "/" ? "/index.html" : url.pathname;
  try {
    const data = await readFile(join(ROOT, "public" + p));
    res.writeHead(200, { "content-type": MIME[p.slice(p.lastIndexOf("."))] || "application/octet-stream" });
    res.end(data);
  } catch(e){ res.writeHead(404); res.end("not found"); }
}).listen(PORT, () => console.log(`Bolo Booking v2 on http://localhost:${PORT} (LLM_PROVIDER=${process.env.LLM_PROVIDER || "claude-cli"})`));

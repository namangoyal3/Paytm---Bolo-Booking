// Cloudflare Worker entry - same agents as the local server. LLM runs as "none"
// (offline keyword parser) in the cloud: the Claude CLI only exists on a local machine.
// Memory is per-session in-memory on Workers (no filesystem).
import { orchestrate } from "./orchestrator.js";
import { DEFAULT_PREFS, newSession } from "./memory-shared.js";
const sessions = new Map();
export default {
  async fetch(request, env){
    const url = new URL(request.url);
    if (url.pathname === "/api/chat" && request.method === "POST"){
      const { message, sessionId } = await request.json();
      const sid = sessionId || "default";
      if (!sessions.has(sid)) sessions.set(sid, newSession({ ...DEFAULT_PREFS }));
      const out = await orchestrate(message || "", sessions.get(sid));
      return Response.json({ reply: out.reply || "", cards: out.cards || null, ticket: out.ticket || null,
        vertical: out.vertical, retrieved: out.retrieved || null, engine: out.nlu?.engine || "keyword" });
    }
    return env.ASSETS.fetch(request);
  }
};

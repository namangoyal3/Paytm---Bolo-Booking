// Cloudflare Worker entry - same orchestrator and agents as the local server. LLM runs as "none"
// (offline keyword parser) in the cloud: the Claude CLI only exists on a local machine.
// Memory is per-session in-memory on Workers (no filesystem).
import { orchestrate } from "./orchestrator.js";
import { DEFAULT_PREFS, newSession } from "./memory-shared.js";
import { parseChat, chatResponse, chatError } from "./api.js";
const sessions = new Map(); // ponytail: per-isolate and unbounded, like the demo server; add expiry or KV for real traffic
export default {
  async fetch(request, env){
    const url = new URL(request.url);
    if (url.pathname === "/api/chat" && request.method === "POST"){
      const req = parseChat(await request.text());
      if (req.error) return Response.json({ error: req.error }, { status: req.status });
      if (!sessions.has(req.sid)) sessions.set(req.sid, newSession({ ...DEFAULT_PREFS }));
      try {
        return Response.json(chatResponse(await orchestrate(req.message, sessions.get(req.sid), req.lang), req.lang));
      } catch (e){
        console.error("chat failed:", e);
        return Response.json(chatError(req.lang), { status: 500 });
      }
    }
    return env.ASSETS.fetch(request);
  }
};

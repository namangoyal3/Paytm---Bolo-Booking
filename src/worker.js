// Cloudflare Worker entry - same orchestrator and agents as the local server. LLM runs as "none"
// (offline keyword parser) in the cloud: the Claude CLI only exists on a local machine.
// Sessions and the activity log live in one Durable Object. Plain Worker memory is per isolate, so a
// follow-up turn that landed on another isolate used to lose the whole trip.
import { DurableObject } from "cloudflare:workers";
import { orchestrate } from "./orchestrator.js";
import { DEFAULT_PREFS, newSession } from "./memory-shared.js";
import { parseChat, chatResponse, chatError, sessionLabel } from "./api.js";
import { activity, restore } from "./activity.js";

// ponytail: one global object serialises every chat turn; shard by session id (and move the log out) for real traffic
export class Store extends DurableObject {
  sessions = new Map(); // cache over storage; sessions never expire, add an alarm to prune for real traffic
  async fetch(request){
    const url = new URL(request.url);
    if (!this.ready){ restore(await this.ctx.storage.get("activity")); this.ready = true; }
    // Public deploy: the console is open to anyone (demo with sample data, no IPs logged).
    if (url.pathname === "/api/admin/activity") return Response.json(activity(Number(url.searchParams.get("since")) || 0));
    const req = parseChat(await request.text());
    if (req.error) return Response.json({ error: req.error }, { status: req.status });
    const key = "s:" + req.sid;
    if (!this.sessions.has(key)) this.sessions.set(key, (await this.ctx.storage.get(key)) || newSession({ ...DEFAULT_PREFS }, sessionLabel(req.sid)));
    const session = this.sessions.get(key);
    try {
      const out = chatResponse(await orchestrate(req.message, session, req.lang), req.lang);
      await this.ctx.storage.put({ [key]: session, activity: activity().turns });
      return Response.json(out);
    } catch (e){
      console.error("chat failed:", e);
      this.sessions.delete(key); // fall back to the last saved copy, not a half-updated one
      return Response.json(chatError(req.lang), { status: 500 });
    }
  }
}

export default {
  async fetch(request, env){
    const { pathname } = new URL(request.url);
    const isApi = (pathname === "/api/chat" && request.method === "POST") || (pathname === "/api/admin/activity" && request.method === "GET");
    if (isApi) return env.STORE.get(env.STORE.idFromName("global")).fetch(request);
    return env.ASSETS.fetch(request);
  }
};

// LLM layer: local Claude CLI (uses the user's own Claude login, no API key) behind a
// provider switch, with a deterministic offline fallback so the demo never dies.
//   LLM_PROVIDER=claude-cli (default) | none
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";

export const PROVIDER = (process.env.LLM_PROVIDER || "claude-cli").toLowerCase();

// Skip the user's hooks, plugins, MCP servers, tools and CLAUDE.md files (cwd = tmpdir).
// They load on every call: one extraction took 12-17 s with them, ~5 s without. Login auth still works.
const ARGS = ["-p", "--input-format", "stream-json", "--output-format", "stream-json", "--verbose",
  "--model", "haiku", "--setting-sources", "", "--strict-mcp-config", "--tools", "",
  "--no-session-persistence", "--disable-slash-commands"];
const ENV = { ...process.env, CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "1", DISABLE_AUTOUPDATER: "1" };
const TIMEOUT_MS = 45000;

// Warm spare: a Claude process boots (~2-3 s) before the user speaks and waits on stdin.
// Each call uses it for ONE message, then a fresh spare boots, so no conversation leaks
// between turns or users. Idle spares are unref'd; they exit on stdin EOF when Node exits.
function boot(system){
  const p = spawn("claude", [...ARGS, "--system-prompt", system],
    { cwd: tmpdir(), env: ENV, stdio: ["pipe", "pipe", "ignore"] });
  p.stdin.on("error", () => {}); // EPIPE if claude is missing or died
  p.unref(); p.stdin.unref?.(); p.stdout.unref?.();
  const result = new Promise((resolve) => {
    let buf = "";
    p.stdout.on("data", (d) => {
      buf += d;
      let i;
      while ((i = buf.indexOf("\n")) >= 0){
        const line = buf.slice(0, i); buf = buf.slice(i + 1);
        try { const j = JSON.parse(line); if (j.type === "result") resolve(j.is_error ? null : j.result); } catch(e){}
      }
    });
    p.on("exit", () => resolve(null));
    p.on("error", () => resolve(null));
  });
  return { system, p, result };
}
const spares = new Map(); // system prompt -> warm process (understanding + policy answers = 2 processes)
const alive = (c) => c && c.p.exitCode === null && c.p.signalCode === null;

export function warmup(system){
  if (PROVIDER !== "none" && !alive(spares.get(system))) spares.set(system, boot(system));
}
function claudeCli(system, user){
  const c = alive(spares.get(system)) ? spares.get(system) : boot(system);
  spares.set(system, boot(system));
  c.p.stdin.end(JSON.stringify({ type: "user", message: { role: "user", content: user } }) + "\n");
  const timer = setTimeout(() => c.p.kill(), TIMEOUT_MS); // also keeps Node alive while we wait
  return c.result.finally(() => { clearTimeout(timer); c.p.kill(); });
}
export async function llmJson(system, user){
  if (PROVIDER === "none") return null;
  try {
    const out = await claudeCli(system, user);
    if (out){
      const m = out.match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]);
    }
  } catch(e){}
  return null; // caller falls back to deterministic parsing
}
export async function llmText(system, user){
  if (PROVIDER === "none") return null;
  try { const out = await claudeCli(system, user); return out ? String(out).trim().slice(0, 600) || null : null; }
  catch(e){ return null; }
}

// LLM layer: local Claude CLI (uses the user's own Claude login, no API key) behind a
// provider switch, with a deterministic offline fallback so the demo never dies.
//   LLM_PROVIDER=claude-cli (default) | none
import { execFile } from "node:child_process";

export const PROVIDER = (process.env.LLM_PROVIDER || "claude-cli").toLowerCase();

function claudeCli(prompt){
  return new Promise((resolve) => {
    execFile("claude", ["-p", prompt, "--model", "haiku"], { timeout: 45000, maxBuffer: 1024*1024 },
      (err, stdout) => { if (err) return resolve(null); resolve(stdout); });
  });
}
export async function llmJson(system, user){
  if (PROVIDER === "none") return null;
  try {
    const out = await claudeCli(system + "\n\n" + user);
    if (out){
      const m = out.match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]);
    }
  } catch(e){}
  return null; // caller falls back to deterministic parsing
}

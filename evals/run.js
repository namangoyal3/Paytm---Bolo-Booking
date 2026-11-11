// Eval harness: one command, prints pass rates. Runs fully offline (LLM_PROVIDER=none)
// for determinism; the same suites exercise the Claude CLI path when enabled.
//   node evals/run.js
import { route, orchestrate } from "../src/orchestrator.js";
import { localSlots } from "../src/agents/shared.js";
import { retrieve } from "../src/rag.js";
import { newSession } from "../src/memory.js";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const cases = JSON.parse(await readFile(join(dirname(fileURLToPath(import.meta.url)), "cases.json"), "utf8"));
const PREFS = { name: "Naman Goyal", preferredClass: "3A", budget: null, language: "hi-IN", homeCity: "delhi" };
let pass = 0, fail = 0; const fails = [];
function check(name, ok, extra){ if (ok) pass++; else { fail++; fails.push(name + (extra ? " :: " + extra : "")); } }

for (const c of cases.routing){
  const s = newSession({ ...PREFS });
  check(`route: ${c.msg}`, route(c.msg, s) === c.expect, `got ${route(c.msg, s)}`);
}
for (const c of cases.slots){
  const s = localSlots(c.msg, !!c.city);
  let ok = true, why = [];
  if ("from" in c && s.from !== c.from){ ok = false; why.push(`from=${s.from}`); }
  if ("to" in c && c.to && s.to !== c.to){ ok = false; why.push(`to=${s.to}`); }
  if ("city" in c && s.city !== c.city){ ok = false; why.push(`city=${s.city}`); }
  if ("budget" in c && s.budget !== c.budget){ ok = false; why.push(`budget=${s.budget}`); }
  if ("date" in c && s.date !== c.date){ ok = false; why.push(`date=${s.date}`); }
  if ("cls" in c && s.cls !== c.cls){ ok = false; why.push(`cls=${s.cls}`); }
  check(`slots: ${c.msg}`, ok, why.join(" "));
}
for (const c of cases.policy){
  const docs = retrieve(c.q, 3);
  check(`rag: ${c.q}`, docs.some(d => d.id === c.doc) && docs[0].text.toLowerCase().includes(c.token.toLowerCase()), `got ${docs.map(d=>d.id).join(",")}`);
}
for (const [i, c] of cases.guardrails.entries()){
  const s = newSession({ ...PREFS });
  let ticket = false, cancelled = false, pendingSeen = false;
  for (const msg of c.flow){
    const out = await orchestrate(msg, s);
    if (out.ticket) ticket = true;
    if (/^Cancelled/.test(out.reply || "")) cancelled = true;
    if (s.pending) pendingSeen = true;
  }
  if ("expectPending" in c) check(`guardrail#${i+1} pending-before-book`, pendingSeen === c.expectPending);
  if ("expectTicket" in c) check(`guardrail#${i+1} ticket-only-after-confirm`, ticket === c.expectTicket);
  if ("expectCancelled" in c) check(`guardrail#${i+1} cancel-flow`, cancelled === true);
}
console.log(`\nEvals: ${pass} passed, ${fail} failed (${Math.round(100*pass/(pass+fail))}%)`);
if (fails.length){ console.log("Failures:"); for (const f of fails) console.log("  - " + f); process.exit(1); }

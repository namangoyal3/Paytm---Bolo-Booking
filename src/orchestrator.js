// Orchestrator agent: classifies each user turn and delegates to a tool-specialist agent.
// Routing is deterministic (keyword scoring) so it works offline and in evals; the Claude
// CLI (when enabled) refines slot extraction inside the specialists.
import { trainAgent } from "./agents/trainAgent.js";
import { flightAgent } from "./agents/flightAgent.js";
import { busAgent } from "./agents/busAgent.js";
import { hotelAgent } from "./agents/hotelAgent.js";
import { postBookingAgent } from "./agents/postBookingAgent.js";
import { policyAgent } from "./agents/policyAgent.js";
import { learnPrefs } from "./memory-shared.js";

const ROUTES = [
  { vertical:"train", agent:trainAgent, words:["train","rail","rajdhani","shatabdi","garib","irctc","tatkal",] },
  { vertical:"flight", agent:flightAgent, words:["flight","fly","plane","air","udaan","indigo","vistara","air india","akasa"] },
  { vertical:"bus", agent:busAgent, words:["bus","volvo","sleeper"] },
  { vertical:"hotel", agent:hotelAgent, words:["hotel","stay","room","rahne","lodge","resort"] },
  { vertical:"post", agent:postBookingAgent, words:["cancel","refund","change","reschedule","pnr","status","modify"] },
  { vertical:"policy", agent:policyAgent, words:["policy","fee","charge","convenience","travel pass","assured","ticket assure","language","tracking","agoda","cancellation cover","free cancellation"] }
];

export function route(message, session){
  const m = (message||"").toLowerCase();
  // Ongoing booking flow takes priority: a select/confirm/cancel reply stays with the current vertical.
  if (session.lastOptions && /^(haan|ha|yes|confirm|book|theek hai|ok|first|second|third|pehla|doosra|teesra|[123]\b)/.test(m)){
    return session.vertical;
  }
  // Post-booking intents (cancel/refund/change/pnr/status) win over vertical keywords.
  if (/cancel|refund|reschedule|change|modify|pnr|status/.test(m)) return "post";
  let best = null, bestScore = 0;
  for (const r of ROUTES){
    let s = 0; for (const w of r.words) if (m.includes(w)) s += w.length;
    if (s > bestScore){ best = r.vertical; bestScore = s; }
  }
  if (best) return best;
  if (session.vertical) return session.vertical; // continue current conversation
  return "train"; // demo default vertical
}

export async function orchestrate(message, session){
  session.turns++;
  const vertical = route(message, session);
  session.vertical = vertical;
  const agent = ROUTES.find(r => r.vertical === vertical).agent;
  const out = await agent(message, session);
  learnPrefs(session, out.nlu || {});
  out.vertical = vertical;
  return out;
}

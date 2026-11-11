// Shared slot extraction + booking-flow machinery for the specialist agents.
import { llmJson } from "../llm.js";

export const CITY_ALIASES = {
  delhi: ["delhi","dilli","new delhi","ndls","nzm","dee"],
  mumbai: ["mumbai","bombay","mmct","bdts","csmt","bandra"],
  jaipur: ["jaipur"],
  bangalore: ["bangalore","bengaluru"],
  goa: ["goa"],
  lucknow: ["lucknow"]
};
export const norm = s => (s||"").toLowerCase().trim();
export function cityOf(s){
  const n = norm(s); if (!n) return null;
  for (const [city, aliases] of Object.entries(CITY_ALIASES)) if (aliases.some(a => n.includes(a))) return city;
  return null;
}
export function resolveDate(m){
  const today = new Date("2026-11-11T12:00:00+05:30"); // fixed demo anchor
  if (/parso|day after/.test(m)) { today.setDate(today.getDate()+2); }
  else if (/kal|tomorrow/.test(m)) { today.setDate(today.getDate()+1); }
  return today.toISOString().slice(0,10);
}
export function localSlots(message, needCity){
  const m = norm(message);
  let from = null, to = null;
  const se = m.match(/([a-z ]+?)\s+(se|to|->)\s+([a-z ]+)/);
  if (se){ from = cityOf(se[1]); to = cityOf(se[3]) || se[3].replace(/\d.*/,"").trim(); }
  if (!from || !to){ for (const c of Object.keys(CITY_ALIASES)){ if (CITY_ALIASES[c].some(a => m.includes(a))) { if (!from) from = c; else if (c !== from && !to) to = c; } } }
  const b = m.match(/(\d{3,6})\s*(ke andar|under|within|tak|budget)?/);
  const cls = (m.match(/\b(1a|2a|3a|sl|cc|ec)\b/)||[])[1]?.toUpperCase() || null;
  return { from, to: needCity ? null : to, city: needCity ? (to || from) : null,
    budget: b ? parseInt(b[1]) : null, date: resolveDate(m), cls };
}
const SYSTEM = `You are the slot extractor of "Bolo Booking", a voice travel booking demo (Paytm Checkin concept). Today is 2026-11-11 IST, users speak Hinglish/English. Output ONE raw JSON object, no markdown:
{"from": city|null, "to": city|null, "city": city for hotel searches|null, "date": "YYYY-MM-DD"|null, "budget": INR number|null, "cls": "3A" etc|null, "selection": 1-based int|null, "confirm": true|false, "cancel": true|false}
"kal"=tomorrow. If the user picks an option ("doosra", "option 2", a name) set selection. yes/haan/confirm => confirm=true. Output JSON only.`;

export async function extractSlots(message, needCity){
  const llm = await llmJson(SYSTEM, `User said: ${message}`);
  if (llm && (llm.from || llm.to || llm.city || llm.selection || llm.confirm || llm.cancel || llm.budget)){
    if (llm.from) llm.from = cityOf(llm.from) || norm(llm.from);
    if (llm.to) llm.to = cityOf(llm.to) || norm(llm.to);
    if (llm.city) llm.city = cityOf(llm.city) || norm(llm.city);
    if (!llm.date) llm.date = resolveDate(norm(message));
    return { ...llm, engine: "claude-cli" };
  }
  const m = norm(message);
  const sel = m.match(/(first|second|third|pehla|doosra|teesra|\b[123]\b)/);
  const idx = sel ? ({ first:1, pehla:1, "1":1, second:2, doosra:2, "2":2, third:3, teesra:3, "3":3 }[sel[1]]) : null;
  return { ...localSlots(message, needCity),
    selection: idx, confirm: /^(haan|ha|yes|confirm|book|theek hai|ok)\b/.test(m),
    cancel: /cancel|mat karo|rehne do/.test(m), engine: "keyword" };
}
export function pickFrom(session, selection){
  if (!session.lastOptions || !selection) return null;
  return session.lastOptions[selection-1] || null;
}

// Shared language helpers: city names, dates and the offline (keyword) slot parser.
export const TODAY = "2026-11-11"; // fixed demo anchor: sample schedules are undated

// Cities in the sample inventory, plus common ones so the app can say "not in the demo data" instead of guessing.
export const CITY_ALIASES = {
  delhi: ["delhi", "dilli", "new delhi", "ndls", "nzm"],
  mumbai: ["mumbai", "bombay", "mmct", "bdts", "csmt", "bandra"],
  jaipur: ["jaipur"], bangalore: ["bangalore", "bengaluru", "blr"], goa: ["goa"], lucknow: ["lucknow"],
  pune: ["pune"], hyderabad: ["hyderabad"], chennai: ["chennai", "madras"], kolkata: ["kolkata", "calcutta"],
  ahmedabad: ["ahmedabad"], chandigarh: ["chandigarh"], varanasi: ["varanasi", "banaras", "benares"],
  amritsar: ["amritsar"], udaipur: ["udaipur"], agra: ["agra"], kochi: ["kochi", "cochin"], indore: ["indore"],
  bhopal: ["bhopal"], patna: ["patna"], manali: ["manali"], shimla: ["shimla"], rishikesh: ["rishikesh"], dehradun: ["dehradun"]
};
// Words that sit next to "se"/"to" but are not places ("kal se", "flight se").
const NOT_PLACE = new Set(["kal", "aaj", "parso", "mujhe", "mujhko", "hume", "humko", "hamein", "subah", "shaam", "raat",
  "flight", "train", "bus", "hotel", "plane", "rail", "gaadi", "car", "ki", "ka", "ke", "ko", "bhi", "jaana", "jana", "hai",
  "mein", "the", "and", "aur", "yahan", "wahan", "ghar", "main", "hum", "koi", "sabse", "ek", "abhi", "wapsi", "return"]);
const BUDGET = /(?:₹|\brs\.?|\brupees?|\bunder|\bwithin|\bbelow|\bbudget|\bmax)\s*(\d{3,6})|(\d{3,6})\s*(?:ke andar|ke under|tak|se kam|ke neeche|rupees?|rs\b|budget)/;

export const norm = s => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
const word = a => new RegExp(`\\b${a}\\b`);

export function cityOf(s){
  const n = norm(s);
  if (!n) return null;
  for (const [city, aliases] of Object.entries(CITY_ALIASES)) if (aliases.some(a => word(a).test(n))) return city;
  return null;
}
export function addDays(iso, n){
  const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10);
}
export const daysFromToday = iso => Math.round((new Date(iso + "T12:00:00Z") - new Date(TODAY + "T12:00:00Z")) / 864e5);

// null when the message names no date, so a follow-up keeps the date already chosen.
export function resolveDate(m){
  if (/\b(parso|parson|day after)\b/.test(m)) return addDays(TODAY, 2);
  if (/\b(kal|tomorrow)\b/.test(m)) return addDays(TODAY, 1);
  if (/\b(aaj|today|tonight)\b/.test(m)) return TODAY;
  const d = m.match(/\b(\d{1,2})\s*(?:tarikh|nov|november)\b/);
  if (d && +d[1] >= 1 && +d[1] <= 30) return `2026-11-${d[1].padStart(2, "0")}`;
  return null;
}

// Roles come from markers: "X se" / "from X" = origin, "to X" / "X jaana|ko|tak" = destination.
// Unmarked cities fill origin first, then destination ("delhi mumbai flight").
export function localSlots(message, needCity){
  const m = norm(message);
  const found = [];
  for (const [city, aliases] of Object.entries(CITY_ALIASES)){
    for (const a of aliases){
      const r = word(a).exec(m);
      if (r){ found.push({ city, i: r.index, end: r.index + a.length }); break; }
    }
  }
  found.sort((x, y) => x.i - y.i);
  let from = null, to = null;
  const loose = [];
  for (const c of found){
    const before = m.slice(0, c.i), after = m.slice(c.end);
    if (/^\s+se\b/.test(after) || /\bfrom\s+$/.test(before)) from = from || c.city;
    else if (/\b(to|->)\s+$/.test(before) || /^\s+(ko|tak|jaana|jana|jaane|ke liye)\b/.test(after)) to = to || c.city;
    else loose.push(c.city);
  }
  for (const c of loose){ if (!from && c !== to) from = c; else if (!to && c !== from) to = c; }
  if (!from){ const r = m.match(/\b([a-z]{3,})\s+se\b/); if (r && !NOT_PLACE.has(r[1])) from = r[1]; }
  if (!to){ const r = m.match(/\bse\s+([a-z]{3,})\b/); if (r && !NOT_PLACE.has(r[1]) && r[1] !== from) to = r[1]; }
  const b = m.match(BUDGET);
  const cls = (m.match(/\b(1a|2a|3a|sl|cc|ec)\b/) || [])[1]?.toUpperCase() || null;
  return { from: needCity ? null : from, to: needCity ? null : to, city: needCity ? (to || from) : null,
    budget: b ? parseInt(b[1] || b[2], 10) : null, date: resolveDate(m), cls, fromMarked: /\b(se|from)\b/.test(m) };
}

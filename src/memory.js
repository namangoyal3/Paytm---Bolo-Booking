// Memory: per-session state (in-process) + persistent user preferences (JSON file).
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const FILE = join(dirname(fileURLToPath(import.meta.url)), "..", "memory.json");
const DEFAULTS = { name: "Naman Goyal", preferredClass: "3A", budget: null, language: "hi-IN", homeCity: "delhi" };

export async function loadPrefs(){
  try { return { ...DEFAULTS, ...JSON.parse(await readFile(FILE, "utf8")) }; }
  catch(e){ return { ...DEFAULTS }; }
}
export async function savePrefs(prefs){
  try { await writeFile(FILE, JSON.stringify(prefs, null, 2)); } catch(e){}
}
export function newSession(prefs){
  // search = the trip so far; asked = the slot we last asked for ("to", "vertical", "date").
  return { prefs, search: null, lastOptions: null, pending: null, pendingCancel: null, asked: null, bookings: [], turns: 0 };
}
export function learnPrefs(session, nlu){
  // Update persistent prefs from observed choices. Budget is per trip, not a lasting preference:
  // a remembered hotel budget used to hide every flight.
  if (nlu.cls) session.prefs.preferredClass = nlu.cls;
  return session.prefs;
}

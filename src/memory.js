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
  return { prefs, vertical: null, lastOptions: null, search: null, selected: null, pending: null, bookings: [], turns: 0 };
}
export function learnPrefs(session, nlu){
  // Update persistent prefs from observed choices.
  if (nlu.budget) session.prefs.budget = nlu.budget;
  if (nlu.cls) session.prefs.preferredClass = nlu.cls;
  return session.prefs;
}

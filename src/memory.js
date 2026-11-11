// Node-only persistence wrapper: prefs saved to memory.json (gitignored, stays local).
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { DEFAULT_PREFS, newSession, learnPrefs } from "./memory-shared.js";
export { newSession, learnPrefs };
const FILE = join(dirname(fileURLToPath(import.meta.url)), "..", "memory.json");
export async function loadPrefs(){
  try { return { ...DEFAULT_PREFS, ...JSON.parse(await readFile(FILE, "utf8")) }; }
  catch(e){ return { ...DEFAULT_PREFS }; }
}
export async function savePrefs(prefs){
  try { await writeFile(FILE, JSON.stringify(prefs, null, 2)); } catch(e){}
}

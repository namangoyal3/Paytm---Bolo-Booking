// Agent activity for the admin console (/admin): one record per turn with every step the orchestrator took.
// Tools and LLM calls report steps through AsyncLocalStorage, so concurrent requests never mix their steps.
// Works in Node and in Cloudflare Workers (nodejs_compat).
import { AsyncLocalStorage } from "node:async_hooks";

const MAX_TURNS = 200; // ponytail: in-memory ring buffer per process; a real console would write to a log store
const store = new AsyncLocalStorage();
const turns = [];
let seq = 0;

export const traceStep = step => { store.getStore()?.push(step); };
export const withTrace = (steps, fn) => store.run(steps, fn);

export function recordTurn(turn){
  turns.push({ id: ++seq, at: new Date().toISOString(), ...turn });
  if (turns.length > MAX_TURNS) turns.shift();
}
export const activity = (since = 0) => ({ turns: turns.filter(t => t.id > since), max: MAX_TURNS });

// Shared pure memory logic (no fs) - safe for Node and Cloudflare Workers.
export const DEFAULT_PREFS = { name: "Naman Goyal", preferredClass: "3A", budget: null, language: "hi-IN", homeCity: "delhi" };
export function newSession(prefs){
  return { prefs, vertical: null, lastOptions: null, search: null, selected: null, pending: null, pendingCancel: null, bookings: [], turns: 0 };
}
export function learnPrefs(session, nlu){
  if (nlu && nlu.budget) session.prefs.budget = nlu.budget;
  if (nlu && nlu.cls) session.prefs.preferredClass = nlu.cls;
  return session.prefs;
}

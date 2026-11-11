// Shared pure memory logic (no fs) - safe for Node and Cloudflare Workers.
export const DEFAULT_PREFS = { name: "Naman Goyal", preferredClass: "3A", budget: null, language: "hi-IN", homeCity: "delhi" };
export function newSession(prefs){
  // search = the trip so far; asked = the slot we last asked for ("to", "vertical", "date").
  return { prefs, search: null, lastOptions: null, pending: null, pendingCancel: null, asked: null, bookings: [], turns: 0 };
}
export function learnPrefs(session, nlu){
  // Update prefs from observed choices. Budget is per trip, not a lasting preference:
  // a remembered hotel budget used to hide every flight.
  if (nlu && nlu.cls) session.prefs.preferredClass = nlu.cls;
  return session.prefs;
}

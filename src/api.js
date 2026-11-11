// The /api/chat contract, shared by the local server (server.js) and the Cloudflare Worker (src/worker.js):
// input validation at the trust boundary, and one response shape for the UI.
export const MAX_BODY = 8 * 1024;
const ERROR = { en: "Something went wrong. Please try again.", hi: "कुछ गड़बड़ हो गई। फिर से कोशिश कीजिए।" };

// Returns { message, sid, lang } or { status, error }.
export function parseChat(body){
  if (body.length > MAX_BODY) return { status: 413, error: "Message too long" };
  let input;
  try { input = JSON.parse(body || "{}"); } catch { return { status: 400, error: "Invalid JSON" }; }
  if (!input || typeof input !== "object") return { status: 400, error: "Invalid JSON" };
  const message = String(input.message || "").slice(0, 500).trim();
  if (!message) return { status: 400, error: "Empty message" };
  return { message, sid: String(input.sessionId || "default").slice(0, 64), lang: input.lang === "en" ? "en" : "hi" };
}

export const chatResponse = (out, lang) => ({
  reply: out.reply || "", cards: out.cards || null, ticket: out.ticket || null, chips: out.chips || [], trip: out.trip || null,
  agent: out.agent, selected: out.selected ?? null, retrieved: out.retrieved || null, source: out.source || null,
  engine: out.engine, intent: out.intent, lang
});
export const chatError = lang => ({ error: ERROR[lang] || ERROR.hi });

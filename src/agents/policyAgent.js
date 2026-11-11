// Policy specialist: RAG over the Paytm travel policy KB. BM25 retrieves the docs; Claude answers in the
// user's language from those docs only. Offline, the top doc's text is the answer.
import { tools } from "../tools.js";
import { llmText, warmup } from "../llm.js";
import { traceStep } from "../activity.js";

const SYSTEM = `You answer travel-policy questions for "Bolo Booking" (Paytm Checkin demo). Use ONLY the knowledge-base docs given. Reply in the requested language in one or two short spoken sentences: no markdown, no lists, no URLs. If the docs do not answer the question, say you don't have that information.`;
warmup(SYSTEM);

export async function policyAgent(query, message, lang, t){
  const docs = tools.kb_search({ query, k: 3 });
  if (!docs.length) return { reply: t.policyMiss(), retrieved: [] };
  const t0 = Date.now();
  const answer = await llmText(SYSTEM, `LANGUAGE: ${lang === "en" ? "English" : "Hindi (Devanagari)"}\n` +
    `DOCS:\n${docs.map(d => `- ${d.title}: ${d.text}`).join("\n")}\nQUESTION: ${message}`);
  traceStep({ type: "llm", name: "Grounded answer", engine: answer ? "claude" : "offline (top doc text)", ms: Date.now() - t0 });
  return { reply: answer || docs[0].text, retrieved: docs.map(d => d.id), source: { title: docs[0].title, url: docs[0].source } };
}

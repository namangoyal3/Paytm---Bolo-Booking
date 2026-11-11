// Retrieval for the RAG pipeline: BM25-lite (TF-IDF with length norm), fully local, no deps.
import { KB } from "./kb/policies.js";

const STOP = new Set(["the","a","an","is","on","in","for","of","to","and","or","kya","hai","ka","ki","ke","mein","se"]);
// ponytail: suffix strip, not a real stemmer ("refunds" -> "refund", "confirmed" / "confirmation" -> "confirm").
// Swap in Porter stemming if recall still misses.
const SUFFIX = ["ation", "ing", "ed", "es", "s"];
function stem(t){
  if (t.endsWith("ss")) return t;
  for (const x of SUFFIX) if (t.endsWith(x) && t.length - x.length >= 3) return t.slice(0, -x.length);
  return t;
}
function tokens(s){ return (s||"").toLowerCase().replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter(t => t && !STOP.has(t)).map(stem); }

const DOCS = KB.map(d => ({ ...d, toks: tokens(d.title + " " + d.text) }));
const DF = {};
for (const d of DOCS) for (const t of new Set(d.toks)) DF[t] = (DF[t]||0) + 1;
const N = DOCS.length;
const AVGDL = DOCS.reduce((a,d) => a + d.toks.length, 0) / N;

export function retrieve(query, k = 3){
  const q = tokens(query);
  const scored = DOCS.map(d => {
    const tf = {};
    for (const t of d.toks) tf[t] = (tf[t]||0) + 1;
    let score = 0;
    for (const t of q){
      if (!tf[t]) continue;
      const idf = Math.log(1 + (N - DF[t] + 0.5) / (DF[t] + 0.5));
      score += idf * (tf[t] * 2.2) / (tf[t] + 1.2 * (0.25 + 0.75 * d.toks.length / AVGDL));
    }
    return { doc: d, score };
  }).filter(s => s.score > 0).sort((a,b) => b.score - a.score).slice(0, k);
  return scored.map(s => ({ id: s.doc.id, title: s.doc.title, text: s.doc.text, source: s.doc.source, score: +s.score.toFixed(2) }));
}

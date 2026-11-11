// Policy specialist: RAG over the Paytm travel policy KB. Answers only from retrieved docs.
import { tools } from "../tools.js";

export async function policyAgent(message, session){
  const docs = tools.kb_search({ query: message, k: 3 });
  if (!docs.length) return { reply: "I don't have that in the policy knowledge base - the KB only carries Paytm's published travel policies and offers." };
  const top = docs[0];
  const more = docs.slice(1).map(d => `- ${d.title}: ${d.text}`).join("\n");
  return {
    reply: `${top.text}\n\nSource: ${top.title}${more ? "\n\nRelated:\n" + more : ""}`,
    retrieved: docs.map(d => d.id)
  };
}

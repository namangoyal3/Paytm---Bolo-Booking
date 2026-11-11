// Agent console: polls /api/admin/activity and draws each turn as a pipeline (heard -> understood -> trip -> agent -> tools -> outcome -> reply).
import { el, icon, AGENT_ICON, STR } from "/ui.js";

const POLL_MS = 1500, MAX = 200;
const AGENT = { ...STR.en.agents, orchestrator: "Orchestrator", post: "Post-booking agent", policy: "Policy agent (RAG)" };
const ENGINE = { claude: ["Claude", "var(--navy)"], instant: ["Instant rule", "var(--sky)"], keyword: ["Keyword parser", "var(--ink-3)"] };
const TOOL_MODE = { search_trains: "train", search_flights: "flight", search_buses: "bus", search_hotels: "hotel" };
const token = new URLSearchParams(location.search).get("token");
const $ = id => document.getElementById(id);
const state = { turns: [], since: 0, selected: null, follow: true, live: true, session: "", denied: false };

const time = iso => new Date(iso).toLocaleTimeString("en-IN", { hour12: false });
const ms = n => n == null ? "" : n < 1000 ? `${n} ms` : `${(n / 1000).toFixed(1)} s`;
const visible = () => state.turns.filter(t => !state.session || t.session === state.session);

async function poll(){
  if (state.live){
    try {
      const res = await fetch(`/api/admin/activity?since=${state.since}`, { headers: token ? { "x-admin-token": token } : {} });
      if (res.status === 403){ state.denied = true; render(); return; }
      const { turns } = await res.json();
      if (turns.length){
        state.turns = [...state.turns, ...turns].slice(-MAX);
        state.since = turns.at(-1).id;
        if (state.follow) state.selected = turns.at(-1).id;
        render(new Set(turns.map(t => t.id)));
      }
    } catch { /* server restarting: try again next tick */ }
  }
  setTimeout(poll, POLL_MS);
}

function render(fresh = new Set()){
  if (state.denied){
    $("detail").replaceChildren(el("p", { class: "empty", text: "Admin only. Open this page on the machine that runs the server, or add ?token=… when ADMIN_TOKEN is set." }));
    return;
  }
  const list = visible();
  renderStats(list); renderSessions(); renderList(list, fresh); renderAgents(list);
  const t = list.find(x => x.id === state.selected) || list.at(-1);
  $("detail").replaceChildren(...(t ? renderTurn(t) : [el("p", { class: "empty" }, "No turns yet. ", el("a", { href: "/", target: "_blank", text: "Open the app" }), " and say something.")]));
}

function renderStats(list){
  const times = list.map(t => t.ms.total).sort((a, b) => a - b);
  $("kTurns").textContent = list.length;
  $("kMs").textContent = times.length ? ms(times[Math.floor(times.length / 2)]) : "–";
  $("kBooked").textContent = list.filter(t => t.outcome?.booked).length;
  $("kErrors").textContent = list.filter(t => t.error).length;
  const n = list.length || 1, count = k => list.filter(t => t.engine === k).length;
  $("engines").replaceChildren(...Object.entries(ENGINE).map(([k, [, c]]) => el("i", { style: `width:${count(k) / n * 100}%;background:${c}` })));
  $("engineLegend").replaceChildren(...Object.entries(ENGINE).map(([k, [label, c]]) => el("li", { style: `--c:${c}`, text: `${label} ${count(k)}` })));
}

function renderSessions(){
  const ids = [...new Set(state.turns.map(t => t.session))];
  const sel = $("session");
  if (sel.options.length - 1 === ids.length) return;
  sel.replaceChildren(el("option", { value: "", text: "All sessions" }), ...ids.map(id => el("option", { value: id, text: `Session ${id}` })));
  sel.value = state.session;
}

function renderList(list, fresh){
  $("listCount").textContent = list.length;
  $("turns").replaceChildren(...list.slice().reverse().map(t => el("li", { class: fresh.has(t.id) ? "new" : "" },
    el("button", { type: "button", class: t.error ? "err" : "", "aria-current": String(t.id === state.selected),
      onclick: () => { state.selected = t.id; state.follow = t.id === list.at(-1).id; render(); } },
      el("span", { class: "ic" }, icon(t.error ? "warning" : AGENT_ICON[t.agent] || "waveform")),
      el("span", { class: "msg", text: t.message }),
      el("span", { class: "muted num mono", text: ms(t.ms.total) }),
      el("span", { class: "meta", text: `${time(t.at)} · ${AGENT[t.agent] || "failed"} · ${ENGINE[t.engine]?.[0] || "–"} · ${t.session}` })))));
}

function renderAgents(list){
  const counts = Object.entries(list.reduce((a, t) => (t.agent && (a[t.agent] = (a[t.agent] || 0) + 1), a), {})).sort((a, b) => b[1] - a[1]);
  const top = counts[0]?.[1] || 1;
  $("agents").replaceChildren(...(counts.length ? counts.map(([a, c]) => el("li", {},
    el("span", {}, icon(AGENT_ICON[a] || "waveform"), " ", AGENT[a] || a), el("span", { class: "num muted", text: c }),
    el("span", { class: "track" }, el("i", { style: `width:${c / top * 100}%` }))))
    : [el("li", { class: "muted", text: "No agent has run yet" })]));
}

const kv = obj => el("div", { class: "kv" }, ...Object.entries(obj || {}).filter(([, v]) => v != null && v !== "")
  .map(([k, v]) => el("span", {}, el("em", { text: k }), Array.isArray(v) ? v.join(", ") : String(v))));
const step = (cls, ic, title, body, time) => el("li", { class: `step ${cls}` },
  el("span", { class: "node" }, icon(ic, true)), el("div", {}, el("h3", { text: title }), ...[body].flat()), el("span", { class: "ms num mono", text: time || "" }));

function toolCard(s, agent){
  const side = TOOL_MODE[s.name] && agent !== "orchestrator" && TOOL_MODE[s.name] !== agent;
  const r = s.result || {};
  const res = "count" in r ? `${r.count} result${r.count === 1 ? "" : "s"}${r.top?.length ? `: ${r.top.join(", ")}` : ""}`
    : Object.entries(r).map(([k, v]) => `${k} ${v}`).join(" · ");
  return el("div", { class: `tool${side ? " side" : ""}` },
    el("div", { class: "tool-head" }, el("b", { text: s.name }), el("span", { class: "muted mono", text: side ? `checks other modes · ${ms(s.ms)}` : ms(s.ms) })),
    kv(s.args), res ? el("p", { text: res }) : null);
}

function outcome(t){
  const o = t.outcome || {};
  if (o.booked) return el("span", { class: "badge ok" }, icon("check-circle", true), `Booked, PNR ${o.booked}`);
  if (o.cancelled) return el("span", { class: "badge", text: `Cancelled PNR ${o.cancelled}` });
  if (o.awaiting) return el("span", { class: "badge", text: `Holding option ${o.selected != null ? o.selected + 1 : ""}, waiting for an explicit yes` });
  if (o.cards) return el("span", { class: "badge", text: `Showed ${o.cards} options` });
  if (o.asked) return el("span", { class: "badge", text: `Asked for: ${o.asked}` });
  return el("span", { class: "muted", text: "Answered" });
}

function renderTurn(t){
  const trip = t.trip ? { route: t.trip.to ? `${t.trip.from || "?"} → ${t.trip.to}` : null, date: t.trip.date, mode: t.trip.vertical || "all modes", class: t.trip.cls, budget: t.trip.budget, sort: t.trip.sort } : null;
  const tools = t.steps.filter(s => s.type !== "guard"), guards = t.steps.filter(s => s.type === "guard");
  const engine = ENGINE[t.engine]?.[0];
  return [
    el("div", { class: "detail-head" }, el("b", { text: `Turn ${t.id}` }), el("span", { class: "mono", text: `${time(t.at)} · session ${t.session} · ${t.lang === "en" ? "English" : "Hindi"} · total ${ms(t.ms.total)}` })),
    el("ol", { class: "rail" },
      step("", "microphone", "Heard", el("p", { class: "said", text: `“${t.message}”` })),
      step(t.engine ? "" : "fail", "brain", "Understood", [
        el("div", {}, el("span", { class: "badge", text: engine || "failed" }), " ", el("span", { class: "muted", text: `intent ${t.intent || "–"}` })),
        kv(t.understood)], ms(t.ms.understand)),
      trip ? step("", "map-trifold", "Trip state after merge", kv(trip)) : null,
      step(t.agent ? "" : "fail", AGENT_ICON[t.agent] || "waveform", "Handed to", el("b", { text: AGENT[t.agent] || "No agent (failed)" })),
      tools.length ? step("", "wrench", `Tool calls (${tools.length})`, tools.map(s => s.type === "llm"
        ? el("div", { class: "tool" }, el("div", { class: "tool-head" }, el("b", { text: s.name }), el("span", { class: "muted mono", text: `${s.engine} · ${ms(s.ms)}` })))
        : toolCard(s, t.agent))) : null,
      ...guards.map(g => step("guard", "shield-check", "Guardrail", [el("b", { text: g.name }), kv(g.result)])),
      step(t.error ? "fail" : "", t.error ? "warning" : "flag-checkered", "Outcome", t.error ? el("span", { class: "badge bad", text: t.error }) : outcome(t)),
      t.reply ? step("", "chat-text", "Reply", el("p", { class: "reply", text: t.reply })) : null)
  ];
}

$("session").addEventListener("change", e => { state.session = e.target.value; state.follow = true; state.selected = null; render(); });
$("live").addEventListener("click", e => {
  state.live = !state.live;
  e.currentTarget.setAttribute("aria-pressed", String(state.live));
  $("liveText").textContent = state.live ? "Live" : "Paused";
});
render();
poll();

// Bolo Booking client: conversation, chips, trip bar, agent trace, and the voice loop
// (tap to talk, live transcript, send on pause, read the reply aloud, listen again if it asked a question).
import { toSpeech } from "/speech.js";
import { STR, AGENT_ICON, el, icon, renderOptions, renderPass, renderHello } from "/ui.js";

const $ = id => document.getElementById(id);
const store = {
  get: k => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode: setting just isn't remembered */ } }
};
const REQUEST_TIMEOUT_MS = 60000; // server gives Claude 45 s before falling back
const TRACE_MAX = 6;
const sessionId = crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2);
const state = { lang: store.get("bolo-lang") === "en" ? "en" : "hi", voice: store.get("bolo-voice") !== "off",
  busy: false, listening: false, handsFree: false, options: null };
const S = () => STR[state.lang];
const log = $("log"), input = $("text"), mic = $("mic"), hint = $("hint");

// ---------- conversation ----------
function scrollTo(node){
  if (node.offsetHeight > log.clientHeight * 0.8) node.scrollIntoView({ block: "start" });
  else log.scrollTop = log.scrollHeight;
}
function add(node){ $("hello")?.remove(); log.append(node); scrollTo(node); return node; }
// "Claude, 1.8 s"; instant replies skip the time (it is only network round trip).
const took = (engine, ms) => [S().engines[engine] || engine, ms >= 100 ? `${(ms / 1000).toFixed(1)} s` : null].filter(Boolean).join(", ");
const who = (agent, extra) => el("div", { class: "who" }, icon(AGENT_ICON[agent] || "waveform"), S().agents[agent] || S().agents.orchestrator, extra ? el("em", { text: extra }) : null);

function setChips(chips){
  $("chips").replaceChildren(...(chips || []).map(c =>
    el("button", { type: "button", class: "chip", onclick: () => send(c.text, c.label) }, c.label)));
}

function setTrip(trip){
  $("trip").hidden = !trip;
  if (!trip) return;
  $("tripRoute").textContent = trip.route || "…";
  $("tripDate").textContent = trip.date;
  $("tripModeIcon").className = `ph ph-${AGENT_ICON[trip.mode] || "path"}`;
  $("tripMode").textContent = trip.modeLabel;
  $("tripBudgetWrap").hidden = !trip.budget;
  $("tripBudget").textContent = trip.budget || "";
}

function pushTrace(agent, engine, ms){
  const list = $("trace");
  list.querySelector(".empty")?.remove();
  list.prepend(el("li", {}, icon(AGENT_ICON[agent] || "waveform"), S().agents[agent] || agent,
    el("em", { class: "num", text: took(engine, ms) })));
  while (list.children.length > TRACE_MAX) list.lastChild.remove();
}

function renderBot(d, ms){
  const replay = el("button", { type: "button", class: "replay", "aria-label": S().replay, title: S().replay }, icon("speaker-simple-high"));
  replay.addEventListener("click", () => speak(d.reply, replay, false));
  const turn = el("article", { class: "turn bot" },
    who(d.agent, took(d.engine, ms)),
    el("div", { class: "say-row" }, el("p", { class: "say", text: d.reply }), d.reply ? replay : null));
  if (d.cards?.length){
    state.options = renderOptions(d.cards, S(), i => send(String(i + 1), S().option(i + 1)));
    turn.append(state.options);
  }
  if (d.ticket) turn.append(renderPass(d.ticket, S()));
  if (d.source && /^https?:\/\//.test(d.source.url || ""))
    turn.append(el("a", { class: "source", href: d.source.url, target: "_blank", rel: "noopener noreferrer" }, icon("book-open-text"), `${S().source}: ${d.source.title}`));
  if (Number.isInteger(d.selected) && state.options){
    [...state.options.children].forEach((c, i) => { c.classList.toggle("is-selected", i === d.selected); c.classList.toggle("is-dim", i !== d.selected); });
  }
  return { turn, replay };
}

function renderError(message, retry){
  return el("article", { class: "turn bot error", role: "alert" }, who("orchestrator"),
    el("div", { class: "say-row" }, icon("warning-circle"), el("p", { class: "say", text: message })),
    el("button", { type: "button", class: "retry", onclick: retry }, icon("arrow-clockwise"), S().retry));
}

async function send(text, label = text, viaVoice = false){
  text = String(text || "").trim();
  if (!text || state.busy) return;
  stopSpeaking();
  state.handsFree = viaVoice && state.voice;
  add(el("div", { class: "turn user" }, el("p", { class: "bubble" }, viaVoice ? icon("microphone", true) : null, label)));
  setChips([]); input.value = "";
  const pending = add(el("article", { class: "turn bot", "aria-busy": "true" }, who("orchestrator", S().thinking), el("div", { class: "skel" }, el("i"), el("i"))));
  state.busy = true; sync();
  const t0 = performance.now();
  try {
    const res = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: text, sessionId, lang: state.lang }), signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d.error || S().error);
    const ms = performance.now() - t0;
    const { turn, replay } = renderBot(d, ms);
    pending.replaceWith(turn);
    setTrip(d.trip); setChips(d.chips); pushTrace(d.agent, d.engine, ms);
    scrollTo(turn); // after chips/trip: they change the log's height
    if (state.voice && d.reply) speak(d.reply, replay, /\?\s*$/.test(d.reply));
  } catch (e){
    state.handsFree = false;
    const msg = e.name === "TypeError" ? S().offline : e.name === "TimeoutError" ? S().error : e.message;
    const err = renderError(msg, () => send(text, label));
    pending.replaceWith(err); scrollTo(err);
  } finally {
    state.busy = false; sync();
  }
}

// ---------- voice out ----------
let voices = [], speakSeq = 0;
const synth = "speechSynthesis" in window ? window.speechSynthesis : null;
const loadVoices = () => { voices = synth?.getVoices() || []; };
synth?.addEventListener?.("voiceschanged", loadVoices); loadVoices();

function pickVoice(tag){ // Chrome's Google voice for the language if present, else any voice for it
  const norm = v => v.lang.replace("_", "-");
  const google = list => list.find(v => /Google/.test(v.name)) || list[0];
  return google(voices.filter(v => norm(v) === tag)) || google(voices.filter(v => norm(v).startsWith(tag.slice(0, 2)))) || null;
}
function stopSpeaking(){ speakSeq++; synth?.cancel(); document.querySelectorAll(".replay.on").forEach(b => b.classList.remove("on")); }
function speak(text, btn, thenListen){
  if (!synth){ if (thenListen && state.handsFree) listen(); return; }
  stopSpeaking();
  const id = speakSeq, u = new SpeechSynthesisUtterance(toSpeech(text, state.lang));
  u.lang = S().speech; const v = pickVoice(u.lang); if (v) u.voice = v;
  const done = () => {
    if (id !== speakSeq) return; // cancelled by a newer utterance or by barge-in
    btn?.classList.remove("on"); hint.textContent = S().hintIdle;
    if (thenListen && state.handsFree) listen();
  };
  u.onend = done; u.onerror = done;
  btn?.classList.add("on"); hint.textContent = S().hintSpeaking;
  synth.speak(u);
}

// ---------- voice in ----------
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null;
function setListening(on){
  state.listening = on;
  $("composer").classList.toggle("is-listening", on);
  mic.classList.toggle("live", on);
  mic.setAttribute("aria-pressed", String(on));
  mic.setAttribute("aria-label", on ? S().micStop : S().mic);
  mic.firstElementChild.className = on ? "ph-fill ph-stop" : "ph-fill ph-microphone";
  hint.textContent = on ? S().hintListening : S().hintIdle;
}
function listen(){
  if (!SR || state.busy || state.listening) return;
  stopSpeaking();
  rec = new SR();
  rec.lang = S().speech; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
  let heard = "", final = false, error = null;
  $("heard").textContent = "";
  rec.onresult = e => {
    heard = [...e.results].map(r => r[0].transcript).join("");
    final = e.results[e.results.length - 1].isFinal;
    $("heard").textContent = heard;
  };
  rec.onerror = e => { error = e.error; };
  rec.onend = () => {
    rec = null; setListening(false);
    if (heard.trim() && (final || !error)) return send(heard, heard, true); // tapping stop sends what was heard
    state.handsFree = false;
    hint.textContent = error === "not-allowed" || error === "service-not-allowed" ? S().hintMicDenied : S().hintNoSpeech;
  };
  try { rec.start(); setListening(true); } catch { rec = null; }
}

// ---------- controls ----------
function sync(){
  mic.disabled = !SR || state.busy;
  $("send").disabled = state.busy || !input.value.trim();
}
function applyLang(){
  const s = S();
  document.documentElement.lang = state.lang;
  document.querySelectorAll("[data-t]").forEach(n => { n.textContent = s[n.dataset.t]; });
  document.querySelectorAll("[data-lang]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === state.lang)));
  document.querySelector(".seg").setAttribute("aria-label", s.language);
  input.placeholder = s.placeholder; input.setAttribute("aria-label", s.placeholder);
  $("send").setAttribute("aria-label", s.send);
  $("heard").dataset.hint = s.listening;
  mic.setAttribute("aria-label", state.listening ? s.micStop : s.mic);
  const vt = $("voiceToggle");
  vt.setAttribute("aria-pressed", String(state.voice)); vt.setAttribute("aria-label", state.voice ? s.voiceOn : s.voiceOff); vt.title = vt.getAttribute("aria-label");
  vt.firstElementChild.className = state.voice ? "ph ph-speaker-high" : "ph ph-speaker-slash";
  hint.textContent = SR ? s.hintIdle : s.hintNoVoice;
  if ($("hello") || !log.children.length) log.replaceChildren(renderHello(s, t => send(t)));
}

document.querySelectorAll("[data-lang]").forEach(b => b.addEventListener("click", () => {
  if (state.listening) rec?.abort();
  state.lang = b.dataset.lang; store.set("bolo-lang", state.lang); applyLang();
}));
$("voiceToggle").addEventListener("click", () => {
  state.voice = !state.voice; store.set("bolo-voice", state.voice ? "on" : "off");
  if (!state.voice){ stopSpeaking(); state.handsFree = false; }
  applyLang();
});
mic.addEventListener("click", () => {
  if (state.listening) return rec?.stop();
  state.handsFree = state.voice; listen();
});
input.addEventListener("input", sync);
$("composer").addEventListener("submit", e => { e.preventDefault(); send(input.value); });

applyLang(); sync();

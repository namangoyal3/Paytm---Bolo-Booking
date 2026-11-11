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
  busy: false, listening: false, handsFree: false, options: null, trip: null };
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

// The Paytm-style search card mirrors what the assistant understood; the mode tabs mirror the vertical.
function setTrip(trip){
  state.trip = trip;
  document.querySelectorAll("[data-mode]").forEach(b => b.setAttribute("aria-current", String(!!trip && b.dataset.mode === trip.mode)));
  $("trip").hidden = !trip;
  if (!trip) return;
  const hotel = trip.mode === "hotel";
  $("fromLabel").textContent = hotel ? S().city : S().from;
  const fill = (id, v) => { $(id).textContent = v || S().choose; $(id).classList.toggle("empty", !v); };
  fill("tripFrom", hotel ? trip.to : trip.from); fill("tripTo", trip.to);
  $("toField").hidden = hotel; $("swap").hidden = hotel || !trip.from || !trip.to;
  $("tripDate").textContent = trip.date;
  $("tripModeWrap").hidden = hotel;
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
  const card = el("div", { class: "bot-card" }, who(d.agent, took(d.engine, ms)),
    el("div", { class: "say-row" }, el("p", { class: "say", text: d.reply }), d.reply ? replay : null));
  const turn = el("article", { class: "turn bot" }, card);
  if (d.cards?.length){
    state.options = renderOptions(d.cards, S(), i => send(String(i + 1), S().option(i + 1)));
    turn.append(state.options);
  }
  if (d.ticket) turn.append(renderPass(d.ticket, S()));
  if (d.source && /^https?:\/\//.test(d.source.url || ""))
    card.append(el("a", { class: "source", href: d.source.url, target: "_blank", rel: "noopener noreferrer" }, icon("book-open-text"), `${S().source}: ${d.source.title}`));
  if (Number.isInteger(d.selected) && state.options){
    [...state.options.children].forEach((c, i) => { c.classList.toggle("is-selected", i === d.selected); c.classList.toggle("is-dim", i !== d.selected); });
  }
  return { turn, replay };
}

function renderError(message, retry){
  return el("article", { class: "turn bot error", role: "alert" }, el("div", { class: "bot-card" }, who("orchestrator"),
    el("div", { class: "say-row" }, icon("warning-circle"), el("p", { class: "say", text: message })),
    el("button", { type: "button", class: "retry", onclick: retry }, icon("arrow-clockwise"), S().retry)));
}

async function send(text, label = text, viaVoice = false){
  text = String(text || "").trim();
  if (!text || state.busy) return;
  stopSpeaking();
  state.handsFree = viaVoice && state.voice;
  add(el("div", { class: "turn user" }, el("p", { class: "bubble" }, viaVoice ? icon("microphone", true) : null, label)));
  setChips([]); input.value = "";
  const pending = add(el("article", { class: "turn bot", "aria-busy": "true" }, el("div", { class: "bot-card" }, who("orchestrator", S().thinking), el("div", { class: "skel" }, el("i"), el("i")))));
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
// Chrome speech quirks this works around: online voices stop after ~15 s without an end event (so queue one
// utterance per sentence); a garbage-collected utterance never fires its end event (so keep references);
// speak() called inside a previous utterance's end handler sometimes never plays (so queue them all at once);
// cancel() right before speak() can kill the new utterance (so cancel only when something is playing);
// and sometimes no event arrives at all (so a watchdog finishes the turn).
const TTS_MS_PER_CHAR = 110, TTS_GRACE_MS = 2500;
let utterances = [];
function stopSpeaking(){
  speakSeq++; utterances = [];
  if (synth && (synth.speaking || synth.pending)) synth.cancel();
  document.querySelectorAll(".replay.on").forEach(b => b.classList.remove("on"));
}
function speak(text, btn, thenListen){
  stopSpeaking();
  const id = speakSeq, voice = pickVoice(S().speech);
  const parts = toSpeech(text, state.lang).split(/(?<=[।?!.])\s+/).filter(p => p.trim());
  let watchdog = 0;
  const finish = () => {
    if (id !== speakSeq) return; // a newer reply or a barge-in took over
    clearTimeout(watchdog); speakSeq++; utterances = [];
    btn?.classList.remove("on"); hint.textContent = S().hintIdle;
    if (thenListen && state.handsFree) listen();
  };
  if (!synth || !parts.length) return finish();
  let left = parts.length;
  watchdog = setTimeout(finish, parts.join(" ").length * TTS_MS_PER_CHAR + TTS_GRACE_MS);
  btn?.classList.add("on"); hint.textContent = S().hintSpeaking;
  synth.resume(); // Chrome can leave the queue paused after the tab sat idle
  utterances = parts.map(p => {
    const u = new SpeechSynthesisUtterance(p);
    u.lang = S().speech; if (voice) u.voice = voice;
    u.onend = u.onerror = () => { if (--left === 0) finish(); };
    return u;
  });
  utterances.forEach(u => synth.speak(u));
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
// One tap = one "listen turn". Chrome's single-phrase mode ends at the first short pause (and after a few
// silent seconds), which cut Hindi sentences off mid-way. So recognition runs continuous, this code decides
// when the user is done (a pause after speech), and if Chrome ends recognition on its own (network blip,
// its own timeouts) the turn restarts it instead of stopping.
const SILENCE_AFTER_FINAL_MS = 2000, SILENCE_AFTER_INTERIM_MS = 3000, NO_SPEECH_MS = 9000, MAX_LISTEN_MS = 30000;
let turn = null;
const ERROR_HINT = () => ({ "not-allowed": S().hintMicDenied, "service-not-allowed": S().hintMicDenied,
  "audio-capture": S().hintNoMic, network: S().hintNetwork });

function listen(){
  if (!SR || state.busy || state.listening) return;
  stopSpeaking();
  const t = turn = { text: "", session: "", stop: false, error: null, timer: 0, cap: 0, started: Date.now() };
  $("heard").textContent = "";
  setListening(true);
  t.timer = setTimeout(stopListening, NO_SPEECH_MS);
  t.cap = setTimeout(stopListening, MAX_LISTEN_MS);
  startRecognition(t);
}

function startRecognition(t){
  const r = rec = new SR();
  r.lang = S().speech; r.interimResults = true; r.continuous = true; r.maxAlternatives = 1;
  r.onresult = e => {
    if (t !== turn) return;
    let fin = "", live = "";
    for (const x of e.results) x.isFinal ? fin += x[0].transcript : live += x[0].transcript;
    t.session = fin + live;
    $("heard").textContent = `${t.text} ${t.session}`.trim();
    clearTimeout(t.timer);
    t.timer = setTimeout(stopListening, live.trim() ? SILENCE_AFTER_INTERIM_MS : SILENCE_AFTER_FINAL_MS);
  };
  r.onerror = e => { if (!["no-speech", "aborted"].includes(e.error)) t.error = e.error; };
  r.onend = () => {
    if (rec === r) rec = null;
    if (t !== turn) return; // cancelled (language switch)
    t.text = `${t.text} ${t.session}`.trim(); t.session = "";
    if (!t.stop && !t.error){ // Chrome stopped by itself: keep listening
      try { return startRecognition(t); } catch { /* fall through and finish */ }
    }
    finishListening(t);
  };
  try { r.start(); }
  catch (e){ t.error = t.error || e.name; if (rec === r) rec = null; finishListening(t); }
}

function stopListening(){ // the user tapped stop, paused after speaking, or a time limit passed
  const t = turn;
  if (!t || t.stop) return;
  t.stop = true; clearTimeout(t.timer);
  if (rec) rec.stop(); else finishListening(t);
}

function finishListening(t){
  if (t !== turn) return;
  turn = null; clearTimeout(t.timer); clearTimeout(t.cap);
  setListening(false);
  if (t.text) return send(t.text, t.text, true);
  state.handsFree = false;
  hint.textContent = ERROR_HINT()[t.error] || (t.error ? `${S().hintMicFailed} (${t.error})` : S().hintNoSpeech);
}

function cancelListening(){ // drop what was heard (language switch)
  const t = turn;
  if (!t) return;
  turn = null; clearTimeout(t.timer); clearTimeout(t.cap);
  const r = rec; rec = null; r?.abort();
  setListening(false);
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
  $("swap").setAttribute("aria-label", s.swap); $("swap").title = s.swap;
  if (state.trip) setTrip(state.trip);
  $("heard").dataset.hint = s.listening;
  mic.setAttribute("aria-label", state.listening ? s.micStop : s.mic);
  const vt = $("voiceToggle");
  vt.setAttribute("aria-pressed", String(state.voice)); vt.setAttribute("aria-label", state.voice ? s.voiceOn : s.voiceOff); vt.title = vt.getAttribute("aria-label");
  vt.firstElementChild.className = state.voice ? "ph ph-speaker-high" : "ph ph-speaker-slash";
  hint.textContent = SR ? s.hintIdle : s.hintNoVoice;
  if ($("hello") || !log.children.length) log.replaceChildren(renderHello(s, t => send(t)));
}

document.querySelectorAll("[data-lang]").forEach(b => b.addEventListener("click", () => {
  cancelListening();
  state.lang = b.dataset.lang; store.set("bolo-lang", state.lang); applyLang();
}));
document.querySelectorAll("[data-mode]").forEach(b => b.addEventListener("click", () => {
  if (b.getAttribute("aria-current") === "true") return;
  send(S().tabSend[b.dataset.mode], b.textContent.trim());
}));
$("swap").addEventListener("click", () => send(S().swapSend, S().swap));
$("voiceToggle").addEventListener("click", () => {
  state.voice = !state.voice; store.set("bolo-voice", state.voice ? "on" : "off");
  if (!state.voice){ stopSpeaking(); state.handsFree = false; }
  applyLang();
});
mic.addEventListener("click", () => {
  if (state.listening) return stopListening();
  state.handsFree = state.voice; listen();
});
input.addEventListener("input", sync);
$("composer").addEventListener("submit", e => { e.preventDefault(); send(input.value); });

applyLang(); sync();

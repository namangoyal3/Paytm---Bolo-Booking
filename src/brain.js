// Understanding step of the orchestrator. Turns the latest message + the session's trip state into a turn:
//   { intent, vertical, from, to, date, budget, cls, sort, selection, query, say }
// Both paths return ONLY what this message says or changes; the orchestrator merges it into the trip.
//   Claude (user's own login) reads Hindi/Hinglish/English in context: follow-ups, fragments, corrections.
//   The keyword parser handles short unambiguous replies instantly and is the offline/failure fallback.
import { llmJson, warmup } from "./llm.js";
import { toHinglish } from "./hinglish.js";
import { norm, cityOf, localSlots, TODAY } from "./agents/shared.js";

const INTENTS = ["search", "select", "confirm", "decline", "status", "cancel", "change", "policy", "greet", "other"];
const VERTICALS = ["train", "flight", "bus", "hotel"];
const SORTS = ["cheapest", "fastest", "earliest"];
const CLASSES = ["SL", "3A", "2A", "1A", "CC", "EC"];

const VERTICAL_WORDS = {
  train: ["train", "trains", "rail", "rajdhani", "shatabdi", "garib rath", "irctc", "tatkal", "vande bharat"],
  flight: ["flight", "flights", "fly", "plane", "udaan", "indigo", "vistara", "air india", "akasa", "airport"],
  bus: ["bus", "buses", "volvo", "sleeper", "seater"],
  hotel: ["hotel", "hotels", "stay", "room", "rahne", "lodge", "resort", "homestay"]
};
const POLICY_WORDS = ["policy", "fee", "fees", "charge", "charges", "convenience", "travel pass", "assured", "ticket assure",
  "language", "languages", "tracking", "agoda", "cancellation cover", "free cancellation", "offer", "offers"];
const CONFIRM = /^(haan|ha|haa|ji haan|yes|yeah|yep|sure|confirm|book( it| karo| kar do)?|theek hai|thik hai|ok|okay|kar do|done|chalega)\b/;
const DECLINE = /^(nahi|nahin|no|nope|mat karo|rehne do|abhi nahi|not now)\b/;
const GREET = /^(namaste|namaskar|hello|hi|hey|good (morning|afternoon|evening)|thanks|thank you)\b/;
const PICK = { first: 1, pehla: 1, "1": 1, second: 2, doosra: 2, dusra: 2, "2": 2, third: 3, teesra: 3, "3": 3 };
const SORT_RX = { cheapest: /\b(sasta|sasti|cheap|cheapest|lowest|kam daam)\b/, fastest: /\b(fastest|jaldi|quickest|sabse tez)\b/,
  earliest: /\b(earliest|sabse pehla|sabse pehle)\b/ };
const WAPSI = /\b(wapsi|wapas|return|back)\b/;

// Short replies the keyword parser fully understands: answered in ~0 ms instead of a Claude round trip.
const BARE = /^(option\s*)?([123]|first|second|third|pehla|doosra|teesra|haan|ha|yes|ok|okay|confirm|theek hai|nahi|nahin|no)( wala)?[.!।]?$/;
function isSimple(m, session){
  const busy = session.lastOptions || session.pending || session.pendingCancel;
  if (BARE.test(m)) return !!busy;
  if (/^(train|flight|bus|hotel)s?( dikhao| chahiye| bhi)?( dikhao)?[.!?]?$/.test(m)) return true;
  if (/^(aaj|kal|parso|today|tomorrow|day after( tomorrow)?|\d{1,2} november)( ka| ki| ke)?( dikhao)?[.!?]?$/.test(m)) return !!session.search;
  if (/^(sabse )?(sasta|sasti|cheapest)( wala| wali)?( dikhao)?[.!?]?$/.test(m)) return true;
  if (/^(pnr status|pnr|status|cancel karo|cancel)[.!?]?$/.test(m)) return session.bookings.length > 0;
  if (/^(wapsi|return)( ka| ki)?( dikhao)?$/.test(m)) return !!session.search?.from;
  return !!cityOf(m) && cityOf(m) === m.replace(/ (jaana|ko|tak)( hai)?$/, ""); // a bare city name
}

function keywordVertical(m){
  let best = null, top = 0;
  for (const [v, words] of Object.entries(VERTICAL_WORDS)){
    const score = words.filter(w => new RegExp(`\\b${w}\\b`).test(m)).reduce((a, w) => a + w.length, 0);
    if (score > top){ best = v; top = score; }
  }
  return best;
}
const blank = () => ({ intent: "other", vertical: null, from: null, to: null, date: null, budget: null, cls: null,
  sort: null, selection: null, query: null, say: null });

export function offlineTurn(text, session){
  const m = norm(text);
  const turn = blank();
  const awaiting = session.pending || session.pendingCancel;
  if (CONFIRM.test(m) && (awaiting || !keywordVertical(m))) return { ...turn, intent: "confirm" };
  if (DECLINE.test(m)) return { ...turn, intent: "decline" };
  const pick = m.match(/\b(first|second|third|pehla|doosra|dusra|teesra|[123])\b/);
  const sort = Object.keys(SORT_RX).find(k => SORT_RX[k].test(m)) || null;
  const vertical = keywordVertical(m);
  const s = localSlots(m, vertical === "hotel");
  const hasPlace = s.from || s.to || s.city;
  if (session.lastOptions && (pick || sort) && !hasPlace && !vertical)
    return { ...turn, intent: "select", selection: pick ? PICK[pick[1]] : null, sort };
  if (/\b(pnr|status)\b/.test(m)) return { ...turn, intent: "status" };
  const policy = POLICY_WORDS.some(w => new RegExp(`\\b${w}\\b`).test(m));
  if (/\b(cancel|refund)\b/.test(m) && !policy) return { ...turn, intent: "cancel" };
  if (/\b(change|reschedule|modify)\b/.test(m)) return { ...turn, intent: "change" };
  if (policy) return { ...turn, intent: "policy", query: m };
  if (GREET.test(m) && !hasPlace && !vertical) return { ...turn, intent: "greet" };
  let { from, to } = s;
  const city = s.city;
  if (session.asked === "to" && from && !to && !s.fromMarked){ to = from; from = null; } // answer to "kahan jaana hai?"
  if (WAPSI.test(m) && !hasPlace && session.search?.from) ({ from, to } = { from: session.search.to, to: session.search.from });
  if (vertical || from || to || city || s.date || s.budget || sort || s.cls)
    return { ...turn, intent: "search", vertical, from, to: city || to, date: s.date, budget: s.budget, cls: s.cls, sort };
  return turn;
}

const SYSTEM = `You are the understanding step of "Bolo Booking", a voice travel assistant (Paytm Checkin demo) for trains, flights, buses and hotels in India. Users speak Hindi (Devanagari), Hinglish or English, often in fragments that continue the conversation.

You get CONTEXT (JSON: today, the trip so far, options on screen, what awaits confirmation, the last question asked) and USER (the latest message). Output ONE JSON object, no markdown, with only the keys that apply:
{"intent": "search"|"select"|"confirm"|"decline"|"status"|"cancel"|"change"|"policy"|"greet"|"other",
 "vertical": "train"|"flight"|"bus"|"hotel", "from": city, "to": city (for hotels: the hotel's city),
 "date": "YYYY-MM-DD", "budget": INR number, "cls": "SL"|"3A"|"2A"|"1A"|"CC",
 "sort": "cheapest"|"fastest"|"earliest", "selection": 1-based number of an option on screen,
 "query": "English search query for the policy knowledge base", "say": "reply text, only for greet/other"}

Rules:
- Output ONLY what the latest message says or changes. Never copy values from CONTEXT: the app merges them.
- Cities: lowercase English ("delhi", "mumbai", "bangalore", "pune"). Dates relative to today ("kal"/"कल" = tomorrow, "parso"/"परसों" = day after, weekdays, "15 tarikh"); vague ones get a concrete date ("agle hafte"/"next week" = today + 7 days, "weekend" = the coming Saturday).
- Follow-ups: "flight dikhao" -> {"intent":"search","vertical":"flight"}; "parso ka" -> {"intent":"search","date":...}; "wapsi"/"return" -> search with from/to swapped from the trip; "hotel bhi" -> {"intent":"search","vertical":"hotel"}.
- A bare city answering last_question "destination" is "to"; answering "origin" is "from".
- "sabse sasta"/"cheapest"/"jaldi wala" with options on screen -> select with sort; "pehla"/"doosra"/"option 2"/an operator or airline on screen -> select with selection.
- haan/yes/ok/book karo -> confirm; nahi/no/rehne do -> decline.
- Cancel, change or PNR status of the user's OWN booking -> cancel/change/status. General questions about rules, fees, refunds, offers, Travel Pass, Paytm Assured -> policy, with an English query.
- Greetings, thanks, chit-chat or off-topic -> greet/other, with "say": one short warm sentence in CONTEXT.reply_language that steers back to travel.`;
warmup(SYSTEM);

function context(session, lang){
  const s = session.search;
  const weekday = new Date(TODAY + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
  return {
    today: `${TODAY} (${weekday})`,
    reply_language: lang === "en" ? "English" : "Hindi in Devanagari script",
    trip_so_far: s ? { vertical: s.vertical, from: s.from, to: s.to, date: s.date, budget: s.budget, class: s.cls } : null,
    options_on_screen: (session.lastOptions || []).map((o, i) => ({ n: i + 1, title: o.title, departs: o.raw?.dep, price: o.price })),
    awaiting: session.pendingCancel ? `confirm cancelling ${session.pendingCancel.title}`
      : session.pending ? `confirm booking ${session.pending.option.title}` : null,
    last_question: { to: "destination", from: "origin", vertical: "train, flight or bus", date: "new date" }[session.asked] || null,
    has_bookings: session.bookings.length > 0
  };
}

// Claude's JSON is untrusted input: keep only known values, in range.
function clean(r, session){
  if (!r || typeof r !== "object" || !INTENTS.includes(r.intent)) return null;
  const place = v => (typeof v === "string" && v.trim()) ? (cityOf(toHinglish(v)) || norm(v).replace(/[^a-z ]/g, "").trim() || null) : null;
  const n = session.lastOptions?.length || 0;
  const cls = String(r.cls || "").toUpperCase();
  return {
    intent: r.intent,
    vertical: VERTICALS.includes(r.vertical) ? r.vertical : null,
    from: place(r.from), to: place(r.to) || place(r.city),
    date: /^\d{4}-\d{2}-\d{2}$/.test(r.date) && r.date >= TODAY ? r.date : null,
    budget: Number.isFinite(+r.budget) && +r.budget >= 100 ? Math.round(+r.budget) : null,
    cls: CLASSES.includes(cls) ? cls : null,
    sort: SORTS.includes(r.sort) ? r.sort : null,
    selection: Number.isInteger(+r.selection) && +r.selection >= 1 && +r.selection <= n ? +r.selection : null,
    query: typeof r.query === "string" ? r.query.slice(0, 200) : null,
    say: typeof r.say === "string" && r.say.trim() ? r.say.trim().slice(0, 300) : null
  };
}

export async function understand(message, session, lang){
  const text = toHinglish(message);
  if (isSimple(norm(text), session)) return { ...offlineTurn(text, session), engine: "instant" };
  const turn = clean(await llmJson(SYSTEM, `CONTEXT: ${JSON.stringify(context(session, lang))}\nUSER: ${message}`), session);
  return turn ? { ...turn, engine: "claude" } : { ...offlineTurn(text, session), engine: "keyword" };
}

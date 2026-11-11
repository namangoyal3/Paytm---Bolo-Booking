// Orchestrator agent: understands each turn (Claude in context, or the keyword parser), keeps the trip state
// across turns, asks for whatever is missing, and delegates to a specialist: booking (train / flight / bus /
// hotel), post-booking (PNR, cancel, change) or policy (RAG). Replies come back in the user's language.
import { understand, offlineTurn } from "./brain.js";
import { toHinglish } from "./hinglish.js";
import { replies } from "./replies.js";
import { searchTrip, searchAllModes, alternatives, destinations, sortOptions } from "./agents/booking.js";
import { postBookingAgent, confirmCancel } from "./agents/postBookingAgent.js";
import { policyAgent } from "./agents/policyAgent.js";
import { tools } from "./tools.js";
import { TODAY } from "./agents/shared.js";
import { learnPrefs, savePrefs } from "./memory.js";

// Merge what this turn says into the trip so far. Hotels use `to` as their city, so "hotel bhi" after a
// Delhi -> Mumbai search finds Mumbai hotels, and "flight dikhao" after Goa hotels flies to Goa.
export function mergeTrip(prev, turn, prefs){
  const p = prev || {};
  const vertical = turn.vertical || p.vertical || null;
  const sameVertical = vertical === p.vertical;
  return {
    vertical,
    from: turn.from || p.from || null,
    to: turn.to || p.to || null,
    date: turn.date || p.date || TODAY,
    budget: turn.budget || (sameVertical ? p.budget : null) || null, // a hotel budget must not filter flights
    cls: turn.cls || p.cls || prefs.preferredClass || null,
    sort: turn.sort || (sameVertical ? p.sort : null) || null
  };
}

function search(turn, session, t){
  const trip = mergeTrip(session.search, turn, session.prefs);
  session.search = trip; session.pending = null; session.asked = null;
  if (!trip.to){
    session.asked = "to";
    const chips = trip.vertical === "hotel" ? t.hotelCityChips() : t.placeChips(destinations(trip));
    return { agent: trip.vertical || "orchestrator", reply: t.askTo(trip), chips };
  }
  if (trip.vertical !== "hotel"){
    trip.from = trip.from || session.prefs.homeCity; // origin defaults to home city (memory); the reply names it
    if (trip.from === trip.to){ session.asked = "to"; return { agent: trip.vertical || "orchestrator", reply: t.sameCity(trip), chips: t.placeChips(destinations(trip)) }; }
  }
  if (!trip.vertical){ // no mode named: compare them all instead of asking "train, flight ya bus?"
    const { options, groups, relaxed } = searchAllModes(trip);
    session.lastOptions = options.length ? options : null;
    if (!options.length) return { agent: "orchestrator", reply: t.noRouteAny(trip), chips: t.noRouteChips(trip, alternatives(trip)) };
    return { agent: "orchestrator", reply: t.compare(trip, groups, options[0], relaxed), cards: options, chips: t.compareChips(trip, groups) };
  }
  const { options, relaxed } = searchTrip(trip);
  const alt = alternatives(trip);
  session.lastOptions = options.length ? options : null;
  if (!options.length) return { agent: trip.vertical, reply: t.noRoute(trip, alt), chips: t.noRouteChips(trip, alt) };
  return { agent: trip.vertical, reply: t.results(trip, options, relaxed), cards: options, chips: t.resultChips(trip, alt) };
}

function select(turn, session, t){
  const opts = session.lastOptions;
  const idx = turn.selection ? turn.selection - 1 : turn.sort ? opts.indexOf(sortOptions(opts, turn.sort)[0]) : -1;
  if (!opts[idx]) return { agent: session.search.vertical || "orchestrator", reply: t.whichOne(opts.length), chips: t.optionChips(opts.length) };
  session.pending = { option: opts[idx], date: session.search.date, search: { ...session.search } };
  return { agent: opts[idx].kind, reply: t.readBack(opts[idx], session.pending, session.prefs), chips: t.confirmChips(), selected: idx };
}

function confirm(session, t){
  if (session.pendingCancel) return { agent: "post", ...confirmCancel(session, t) };
  if (session.pending){ // GUARDRAIL: books only after a read-back and an explicit yes
    const { option, date, search: trip } = session.pending;
    const booking = { ...tools.book(option, session.prefs, date), search: trip };
    session.bookings.push(booking);
    session.pending = null; session.lastOptions = null;
    return { agent: option.kind, reply: t.booked(booking), ticket: booking, chips: t.afterBooking(booking) };
  }
  if (session.lastOptions) return { agent: session.search.vertical, reply: t.pickFirst(), chips: t.optionChips(session.lastOptions.length) };
  return { agent: "orchestrator", reply: t.nothingToConfirm(), chips: t.starters() };
}

function decline(session, t){
  if (session.pendingCancel){ session.pendingCancel = null; return { agent: "post", reply: t.cancelDropped(), chips: [] }; }
  if (session.pending){
    session.pending = null;
    return { agent: session.search.vertical, reply: t.bookingDropped(), chips: t.optionChips(session.lastOptions?.length || 0) };
  }
  return { agent: "orchestrator", reply: t.okay(), chips: t.starters() };
}

async function handle(turn, message, session, t, lang){
  switch (turn.intent){
    case "confirm": return confirm(session, t);
    case "decline": return decline(session, t);
    case "select": return session.lastOptions ? select(turn, session, t) : search(turn, session, t);
    case "status": case "cancel": case "change": return { agent: "post", ...postBookingAgent(turn, session, t) };
    case "policy": return { agent: "policy", ...(await policyAgent(turn.query || toHinglish(message), message, lang, t)) };
    case "search": return search(turn, session, t);
    case "greet": return { agent: "orchestrator", reply: turn.say || t.greet(session.prefs.name?.split(" ")[0]), chips: t.starters() };
    default: return { agent: "orchestrator", reply: turn.say || t.other(), chips: t.starters() };
  }
}

export async function orchestrate(message, session, lang = "hi"){
  session.turns++;
  const t = replies(lang);
  const turn = await understand(message, session, lang);
  const out = await handle(turn, message, session, t, lang);
  learnPrefs(session, turn);
  await savePrefs(session.prefs);
  return { chips: [], ...out, trip: t.trip(session.search), vertical: out.agent, intent: turn.intent, engine: turn.engine, nlu: turn };
}

// Which specialist the keyword path would pick (used by the routing evals).
export function route(message, session){
  const turn = offlineTurn(toHinglish(message), session);
  if (turn.intent === "policy") return "policy";
  if (["status", "cancel", "change"].includes(turn.intent)) return "post";
  return turn.vertical || session.search?.vertical || "orchestrator";
}

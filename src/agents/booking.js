// Booking specialists (train / flight / bus / hotel): search the vertical's tool for the merged trip,
// relax a remembered budget when it would hide the whole route, and find alternatives when a route is empty.
import { tools } from "../tools.js";
import { TRAINS } from "../data/trains.js";
import { FLIGHTS } from "../data/flights.js";
import { BUSES } from "../data/buses.js";

const TOOL = { train: "search_trains", flight: "search_flights", bus: "search_buses" };
const DATA = { train: TRAINS, flight: FLIGHTS, bus: BUSES };
const minutes = d => { const [, h, m] = /(\d+)h\s*(\d+)?/.exec(d || "") || []; return h ? +h * 60 + (+m || 0) : Infinity; };
const ORDER = {
  cheapest: (a, b) => a.price - b.price,
  fastest: (a, b) => minutes(a.raw.dur) - minutes(b.raw.dur),
  earliest: (a, b) => String(a.raw.dep).localeCompare(String(b.raw.dep))
};
export const sortOptions = (opts, sort) => ORDER[sort] ? [...opts].sort(ORDER[sort]) : opts;

function run(vertical, trip, budget){
  if (vertical === "hotel") return tools.search_hotels({ city: trip.to, budget });
  return tools[TOOL[vertical]]({ from: trip.from, to: trip.to, budget, cls: trip.cls });
}

export function searchTrip(trip){
  let options = run(trip.vertical, trip, trip.budget), relaxed = false;
  if (!options.length && trip.budget){ options = run(trip.vertical, trip, null); relaxed = options.length > 0; }
  return { options: sortOptions(options, trip.sort), relaxed };
}

// No mode chosen yet ("kal mumbai jaana hai"): compare train, flight and bus in one answer instead of asking.
export function searchAllModes(trip){
  const byMode = budget => ["train", "flight", "bus"].map(v => ({ vertical: v, options: run(v, trip, budget) })).filter(g => g.options.length);
  let groups = byMode(trip.budget), relaxed = false;
  if (!groups.length && trip.budget){ groups = byMode(null); relaxed = groups.length > 0; }
  const options = sortOptions(groups.flatMap(g => sortOptions(g.options, "cheapest").slice(0, 2)), "cheapest");
  return { options, relaxed, groups: groups.map(g => ({ vertical: g.vertical, count: g.options.length, min: Math.min(...g.options.map(o => o.price)) })) };
}

// Other ways to make the same trip, and routes this vertical (or any mode) does have.
export function alternatives(trip){
  const verticals = trip.vertical === "hotel" ? []
    : ["train", "flight", "bus"].filter(v => v !== trip.vertical && trip.from && run(v, trip, null).length);
  const seen = new Set();
  const routes = trip.vertical === "hotel" ? [] : (DATA[trip.vertical] || [...TRAINS, ...FLIGHTS, ...BUSES])
    .map(x => ({ from: x.fromCity, to: x.toCity }))
    .filter(r => !seen.has(r.from + r.to) && seen.add(r.from + r.to))
    .slice(0, 3);
  return { verticals, routes };
}

// Destinations this vertical serves from an origin (for "kahan jaana hai?" chips).
export function destinations(trip){
  const pool = trip.vertical && DATA[trip.vertical] ? DATA[trip.vertical] : [...TRAINS, ...FLIGHTS, ...BUSES];
  return [...new Set(pool.filter(x => !trip.from || x.fromCity === trip.from).map(x => x.toCity))];
}

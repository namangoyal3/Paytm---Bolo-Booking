// Tools available to the specialist agents. All data is sample data; booking/payment are mocked.
import { TRAINS } from "./data/trains.js";
import { FLIGHTS } from "./data/flights.js";
import { BUSES } from "./data/buses.js";
import { HOTELS } from "./data/hotels.js";
import { retrieve } from "./rag.js";

function minOf(obj){ return Math.min(...Object.values(obj)); }

export const tools = {
  search_trains({ from, to, budget, cls }){
    return TRAINS.filter(t => t.fromCity === from && t.toCity === to)
      .map(t => ({ kind:"train", id:t.no, title:`${t.no} ${t.name}`, sub:`${t.from} ${t.dep} -> ${t.to} ${t.arr} · ${t.dur}`,
        price: t.classes[cls] || minOf(t.classes), detail: Object.entries(t.classes).map(([k,v])=>`${k} ₹${v}`).join(" · "),
        badge: `${t.odds}% confirmation`, raw:t }))
      .filter(o => !budget || o.price <= budget).sort((a,b) => parseInt(b.badge) - parseInt(a.badge)).slice(0,3);
  },
  search_flights({ from, to, budget }){
    return FLIGHTS.filter(f => f.fromCity === from && f.toCity === to)
      .map(f => ({ kind:"flight", id:f.no, title:`${f.airline} ${f.no}`, sub:`${f.from} ${f.dep} -> ${f.to} ${f.arr} · ${f.dur}${f.nonstop?" · nonstop":""}`,
        price: f.fare, detail: `Economy ₹${f.fare}`, badge: "Zero convenience fee", raw:f }))
      .filter(o => !budget || o.price <= budget).sort((a,b) => a.price - b.price).slice(0,3);
  },
  search_buses({ from, to, budget }){
    return BUSES.filter(b => b.fromCity === from && b.toCity === to)
      .map(b => ({ kind:"bus", id:b.id, title:`${b.operator} (${b.type})`, sub:`${b.dep} -> ${b.arr} · ${b.dur}`,
        price: b.fare, detail: `₹${b.fare} · rated ${b.rating}`, badge: b.assured ? "Paytm Assured" : null, raw:b }))
      .filter(o => !budget || o.price <= budget).sort((a,b) => a.price - b.price).slice(0,3);
  },
  search_hotels({ city, budget }){
    return HOTELS.filter(h => h.city === city)
      .map(h => ({ kind:"hotel", id:h.id, title:`${h.name} (${h.stars} star)`, sub:`${h.area} · rated ${h.rating}${h.breakfast?" · breakfast":""}`,
        price: h.priceNight, detail: `₹${h.priceNight}/night`, badge: "Agoda partner inventory", raw:h }))
      .filter(o => !budget || o.price <= budget).sort((a,b) => a.price - b.price).slice(0,3);
  },
  book(option, prefs, date){
    const pnr = Array.from({length:6}, () => "ABCDEFGHJKMNPQRSTUVWXYZ23456789"[Math.floor(Math.random()*32)]).join("");
    return { pnr, kind: option.kind, title: option.title, sub: option.sub, date, passenger: prefs.name,
      fare: option.price, payment: "UPI - mock success", status: option.kind === "hotel" ? "Confirmed (mock)" : "CNF (mock)" };
  },
  pnr_status(booking){
    return { pnr: booking.pnr, status: "CNF (mock)", detail: `${booking.title} · ${booking.sub} · ${booking.date} · ${booking.passenger}` };
  },
  cancel_booking(booking){
    // Refund per KB policies: flight with Rs 99 cancellation cover -> full refund; train -> instant wallet refund <15 min; bus with Paytm Assured -> timely refund.
    let note;
    if (booking.kind === "flight") note = "Full refund under the Rs 99 free-cancellation cover (if added); otherwise airline charges apply. (mock)";
    else if (booking.kind === "train") note = "Refund to Paytm wallet in under 15 minutes (mock).";
    else if (booking.kind === "bus") note = "Paytm Assured ensures a timely refund (mock).";
    else note = "Free cancellation within the property's window (mock).";
    return { pnr: booking.pnr, cancelled: true, refundNote: note };
  },
  kb_search({ query, k }){ return retrieve(query, k || 3); }
};

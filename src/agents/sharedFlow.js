// Generic bookable-vertical flow shared by train/flight/bus/hotel specialists:
// slots -> tool search -> options -> select -> guardrail confirm -> mock book.
import { extractSlots, pickFrom } from "./shared.js";
import { tools } from "../tools.js";

export function makeVerticalAgent({ vertical, searchTool, needCity, noRouteMsg, confirmLine }){
  return async function agent(message, session){
    const nlu = await extractSlots(message, needCity);
    // GUARDRAIL: nothing books without an explicit confirm after a read-back.
    if (nlu.confirm && session.pending && session.pending.vertical === vertical){
      const { option, date } = session.pending;
      const booking = tools.book(option, session.prefs, date);
      session.bookings.push(booking);
      session.pending = null; session.lastOptions = null; session.selected = null;
      return { reply: `Booked! ${booking.title}. Payment of Rs ${booking.fare} via UPI - mock success.`, ticket: booking, nlu };
    }
    const sel = pickFrom(session, nlu.selection);
    if (sel && session.vertical === vertical){
      session.selected = nlu.selection - 1;
      session.pending = { vertical, option: sel, date: session.search?.date || nlu.date };
      return { reply: confirmLine(sel, session), nlu };
    }
    const args = needCity
      ? { city: nlu.city || nlu.to || nlu.from, budget: nlu.budget || session.prefs.budget }
      : { from: nlu.from, to: nlu.to, budget: nlu.budget || session.prefs.budget, cls: nlu.cls || session.prefs.preferredClass };
    if (!needCity && (!args.from || !args.to))
      return { reply: `Route batayiye - jaise "Delhi se Mumbai, kal, 5000 ke andar".`, nlu };
    if (needCity && !args.city)
      return { reply: "Which city? e.g. 'Mumbai mein hotel, 4000 ke andar'.", nlu };
    const options = tools[searchTool](args);
    session.lastOptions = options.length ? options : null;
    session.search = { ...args, date: nlu.date }; session.selected = null; session.pending = null;
    if (!options.length) return { reply: noRouteMsg, nlu };
    const where = needCity ? args.city : `${args.from} to ${args.to}`;
    return { reply: `Best ${where} options for ${nlu.date}:`, cards: options, nlu };
  };
}

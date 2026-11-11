// Post-booking specialist: PNR status, cancel, change date.
// GUARDRAIL: cancel needs an explicit confirm after a read-back, and only touches this session's bookings (mock).
import { tools } from "../tools.js";

export function postBookingAgent(turn, session, t){
  const last = session.bookings[session.bookings.length - 1];
  if (!last) return { reply: t.noBookings(), chips: t.starters() };
  if (turn.intent === "cancel"){
    session.pendingCancel = last;
    return { reply: t.askCancel(last), chips: t.cancelChips(), ticket: last };
  }
  if (turn.intent === "change"){
    session.search = { ...last.search }; // the trip comes back; the next date the user says re-runs the search
    session.asked = "date";
    return { reply: t.askNewDate(last), chips: t.dateChips(last.date) };
  }
  return { reply: t.status(last), ticket: last, chips: t.afterBooking(last) };
}

export function confirmCancel(session, t){
  const b = session.pendingCancel;
  session.pendingCancel = null;
  tools.cancel_booking(b);
  session.bookings = session.bookings.filter(x => x.pnr !== b.pnr);
  return { reply: t.cancelled(b), cancelled: b.pnr, chips: t.starters() };
}

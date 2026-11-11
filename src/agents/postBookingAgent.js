// Post-booking specialist: PNR status, cancel (with refund note from KB policies), change date.
// GUARDRAIL: cancel/change need an explicit confirm, and only touch session bookings (mock).
import { norm } from "./shared.js";
import { tools } from "../tools.js";

export async function postBookingAgent(message, session){
  const m = norm(message);
  const last = session.bookings[session.bookings.length - 1];
  if (!last) return { reply: "No bookings in this session yet - book something first, then I can show status, change or cancel it." };
  if (session.pendingCancel){
    if (/^(haan|ha|yes|confirm|theek hai|ok)\b/.test(m)){
      const r = tools.cancel_booking(session.pendingCancel);
      session.bookings = session.bookings.filter(b => b.pnr !== r.pnr);
      session.pendingCancel = null;
      return { reply: `Cancelled ${r.pnr}. ${r.refundNote}` };
    }
    session.pendingCancel = null;
    return { reply: "Cancellation dropped. Booking stays as is." };
  }
  if (/cancel|refund/.test(m)){
    session.pendingCancel = last;
    return { reply: `Cancel ${last.title} (PNR ${last.pnr}, Rs ${last.fare})? Say "haan" to confirm cancellation.` };
  }
  if (/change|reschedule|modify/.test(m)){
    return { reply: `Change for ${last.title} (PNR ${last.pnr}): tell me the new date and I'll re-check options - changes are mocked in this demo.` };
  }
  const st = tools.pnr_status(last);
  return { reply: `PNR ${st.pnr}: ${st.status}. ${st.detail}` };
}

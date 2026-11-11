// Reply text in Hindi (Devanagari, so the hi-IN voice reads it naturally) or English.
// Spoken-first: short sentences, no codes or ISO dates; exact times, fares and PNR codes live on the cards.
// Chips are {label, text}: `text` is what gets sent, kept short so the instant parser answers in ~0 ms.
import { addDays, daysFromToday } from "./agents/shared.js";

const HI_CITY = { delhi: "दिल्ली", mumbai: "मुंबई", jaipur: "जयपुर", bangalore: "बेंगलुरु", goa: "गोवा", lucknow: "लखनऊ",
  pune: "पुणे", hyderabad: "हैदराबाद", chennai: "चेन्नई", kolkata: "कोलकाता", ahmedabad: "अहमदाबाद", chandigarh: "चंडीगढ़",
  varanasi: "वाराणसी", amritsar: "अमृतसर", udaipur: "उदयपुर", agra: "आगरा", kochi: "कोच्चि", indore: "इंदौर", bhopal: "भोपाल",
  patna: "पटना", manali: "मनाली", shimla: "शिमला", rishikesh: "ऋषिकेश", dehradun: "देहरादून" };
const MONTH = { hi: ["जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] };
const REL = { hi: ["आज", "कल", "परसों"], en: ["today", "tomorrow", "day after tomorrow"] };
const NOUN = { hi: { train: ["ट्रेन", "ट्रेनें"], flight: ["फ्लाइट", "फ्लाइट"], bus: ["बस", "बसें"], hotel: ["होटल", "होटल"] },
  en: { train: ["train", "trains"], flight: ["flight", "flights"], bus: ["bus", "buses"], hotel: ["hotel", "hotels"] } };
const REFUND = {
  hi: { flight: "₹99 वाला कैंसलेशन कवर लिया हो तो पूरा पैसा वापस, वरना एयरलाइन चार्ज लगेगा।", train: "पैसा 15 मिनट में Paytm वॉलेट में आ जाएगा।",
    bus: "Paytm Assured से रिफंड समय पर मिलेगा।", hotel: "फ्री कैंसलेशन अवधि में पूरा पैसा वापस।" },
  en: { flight: "Full refund if you added the ₹99 cancellation cover; otherwise airline charges apply.",
    train: "The refund reaches your Paytm wallet within 15 minutes.", bus: "Paytm Assured guarantees a timely refund.",
    hotel: "Full refund within the free-cancellation window." }
};
const HOTEL_CITIES = ["mumbai", "jaipur", "goa"];

export const rupees = n => `₹${Number(n).toLocaleString("en-IN")}`;
const cap = s => String(s || "").replace(/\b[a-z]/g, c => c.toUpperCase());
const chip = (label, text = label) => ({ label, text });

export function replies(lang){
  const L = lang === "en" ? "en" : "hi";
  const hi = L === "hi";
  const place = c => (hi && HI_CITY[c]) || cap(c);
  const noun = (v, n = 2) => NOUN[L][v][n === 1 ? 0 : 1];
  const day = iso => { const [, mo, d] = iso.split("-").map(Number); return `${d} ${MONTH[L][mo - 1]}`; };
  const relDay = iso => REL[L][daysFromToday(iso)] || day(iso);
  const when = iso => REL[L][daysFromToday(iso)] ? `${REL[L][daysFromToday(iso)]} (${day(iso)})` : day(iso);
  const clock = hhmm => {
    const [h, mm] = hhmm.split(":").map(Number);
    const h12 = h % 12 || 12, m = String(mm).padStart(2, "0");
    if (!hi) return `${h12}${mm ? ":" + m : ""} ${h < 12 ? "AM" : "PM"}`;
    const part = h < 4 ? "रात" : h < 12 ? "सुबह" : h < 16 ? "दोपहर" : h < 19 ? "शाम" : "रात";
    return mm ? `${part} ${h12}:${m}` : `${part} ${h12} बजे`;
  };
  const dur = d => { const [, h, m] = /(\d+)h\s*(\d+)?/.exec(d || "") || []; return hi ? `${h} घंटे${m ? ` ${m} मिनट` : ""}` : `${h} h${m ? ` ${m} min` : ""}`; };
  const list = xs => xs.join(hi ? " और " : " and ");

  function highlight(s, o){
    const r = o.raw;
    if (s.vertical === "hotel") return hi ? `सबसे सस्ता: ${r.name}, ${rupees(o.price)} प्रति रात।` : `Cheapest: ${r.name}, ${rupees(o.price)} a night.`;
    if (s.vertical === "train" && !s.sort)
      return hi ? `${r.name} में कन्फर्म सीट की संभावना सबसे ज़्यादा है: ${r.odds}%।` : `${r.name} has the best confirmation odds: ${r.odds}%.`;
    const name = r.airline || r.operator || r.name;
    if (s.sort === "fastest") return hi ? `सबसे तेज़: ${name}, ${dur(r.dur)}, ${rupees(o.price)}।` : `Fastest: ${name}, ${dur(r.dur)}, ${rupees(o.price)}.`;
    if (s.sort === "earliest") return hi ? `सबसे पहली: ${name}, ${clock(r.dep)}, ${rupees(o.price)}।` : `Earliest: ${name} at ${clock(r.dep)}, ${rupees(o.price)}.`;
    return hi ? `सबसे सस्ती: ${name}, ${clock(r.dep)}, ${rupees(o.price)}।` : `Cheapest: ${name} at ${clock(r.dep)}, ${rupees(o.price)}.`;
  }

  return {
    greet: name => hi ? `नमस्ते${name ? " " + name : ""}, कहाँ जाना है? ट्रेन, फ्लाइट, बस या होटल, बस बोलिए।`
      : `Hi${name ? " " + name : ""}, where would you like to go? Train, flight, bus or hotel, just say it.`,
    other: () => hi ? "मैं ट्रेन, फ्लाइट, बस और होटल बुक करने में मदद करता हूँ। बताइए, कहाँ जाना है?"
      : "I can book trains, flights, buses and hotels. Where would you like to go?",
    askTo: s => s.vertical === "hotel" ? (hi ? "किस शहर में होटल चाहिए?" : "Which city do you need a hotel in?")
      : s.from ? (hi ? `${place(s.from)} से कहाँ जाना है?` : `Where to from ${place(s.from)}?`) : (hi ? "कहाँ जाना है?" : "Where would you like to go?"),
    compare(s, groups, top, relaxed){
      const head = relaxed ? (hi ? `${rupees(s.budget)} के अंदर कुछ नहीं मिला, तो सबसे सस्ते विकल्प दिखा रहा हूँ। ` : `Nothing under ${rupees(s.budget)}, so here are the cheapest. `) : "";
      const parts = groups.map(g => hi ? `${g.count} ${noun(g.vertical, g.count)} ${rupees(g.min)} से` : `${g.count} ${noun(g.vertical, g.count)} from ${rupees(g.min)}`).join(", ");
      const r = top.raw, name = r.airline || r.operator || r.name;
      return hi ? `${head}${when(s.date)}, ${place(s.from)} से ${place(s.to)}: ${parts}। सबसे सस्ता: ${NOUN.hi[top.kind][0]}, ${name}, ${clock(r.dep)}, ${rupees(top.price)}। कौन सा बुक करूँ?`
        : `${head}${cap(when(s.date))}, ${place(s.from)} to ${place(s.to)}: ${parts}. Cheapest: ${top.kind}, ${name} at ${clock(r.dep)}, ${rupees(top.price)}. Which one should I book?`;
    },
    noRouteAny: s => hi ? `${place(s.from)} से ${place(s.to)} का कोई विकल्प अभी डेमो डेटा में नहीं है। ये रूट आज़माइए।`
      : `Nothing from ${place(s.from)} to ${place(s.to)} in the demo data yet. Try one of these routes.`,
    sameCity: s => hi ? `${place(s.from)} से ${place(s.to)}? यह एक ही शहर है। कहाँ जाना है?` : `${place(s.from)} to ${place(s.to)} is the same city. Where to?`,
    results(s, opts, relaxed){
      const n = opts.length;
      const head = relaxed ? (hi ? `${rupees(s.budget)} के अंदर कुछ नहीं मिला, तो सबसे सस्ते विकल्प दिखा रहा हूँ। ` : `Nothing under ${rupees(s.budget)}, so here are the cheapest. `) : "";
      const found = s.vertical === "hotel"
        ? (hi ? `${place(s.to)} में ${n} होटल ${n === 1 ? "मिला" : "मिले"}, ${when(s.date)} चेक-इन।` : `Found ${n} ${noun("hotel", n)} in ${place(s.to)}, check-in ${when(s.date)}.`)
        : (hi ? `${when(s.date)}, ${place(s.from)} से ${place(s.to)} की ${n} ${noun(s.vertical, n)} ${n === 1 ? "मिली" : "मिलीं"}।`
          : `Found ${n} ${noun(s.vertical, n)} from ${place(s.from)} to ${place(s.to)}, ${when(s.date)}.`);
      const ask = hi ? (s.vertical === "hotel" ? "कौन सा बुक करूँ?" : "कौन सी बुक करूँ?") : "Which one should I book?";
      return `${head}${found} ${highlight(s, opts[0])} ${ask}`;
    },
    noRoute(s, alt){
      if (s.vertical === "hotel") return hi ? `${place(s.to)} में होटल अभी डेमो डेटा में नहीं हैं। ये शहर आज़माइए।` : `No hotels in ${place(s.to)} in the demo data yet. Try one of these cities.`;
      const head = hi ? `${place(s.from)} से ${place(s.to)} की ${noun(s.vertical)} अभी डेमो डेटा में नहीं हैं।` : `No ${noun(s.vertical)} from ${place(s.from)} to ${place(s.to)} in the demo data yet.`;
      if (alt.verticals.length) return `${head} ${hi ? `पर इस रूट पर ${list(alt.verticals.map(v => noun(v)))} हैं।` : `But there are ${list(alt.verticals.map(v => noun(v)))} on this route.`}`;
      return `${head} ${hi ? "ये रूट आज़माइए।" : "Try one of these routes."}`;
    },
    readBack(o, p, prefs){
      const r = o.raw, w = when(p.date);
      const tail = hi ? `यात्री: ${prefs.name}। बुक कर दूँ?` : `Traveller: ${prefs.name}. Shall I book it?`;
      if (o.kind === "flight") return hi ? `${r.airline} ${r.no}, ${w} ${clock(r.dep)}, ${rupees(o.price)}, कोई कन्वीनियंस फीस नहीं। ${tail}`
        : `${r.airline} ${r.no}, ${w} at ${clock(r.dep)}, ${rupees(o.price)}, zero convenience fee. ${tail}`;
      if (o.kind === "train") return hi ? `${r.no} ${r.name}, ${w} ${clock(r.dep)}, ${p.search.cls || "3A"}, ${rupees(o.price)}। कन्फर्म सीट की संभावना ${r.odds}%। ${tail}`
        : `${r.no} ${r.name}, ${w} at ${clock(r.dep)}, ${p.search.cls || "3A"}, ${rupees(o.price)}. ${r.odds}% confirmation odds. ${tail}`;
      if (o.kind === "bus") return hi ? `${r.operator}, ${r.type}, ${w} ${clock(r.dep)}, ${rupees(o.price)}। ${tail}`
        : `${r.operator}, ${r.type}, ${w} at ${clock(r.dep)}, ${rupees(o.price)}. ${tail}`;
      return hi ? `${r.name}, ${r.area}, ${rupees(o.price)} प्रति रात, ${w} चेक-इन। मेहमान: ${prefs.name}। बुक कर दूँ?`
        : `${r.name}, ${r.area}, ${rupees(o.price)} a night, check-in ${w}. Guest: ${prefs.name}. Shall I book it?`;
    },
    whichOne: n => hi ? `कौन सा विकल्प? 1 से ${n} में से चुनिए।` : `Which option? Pick 1 to ${n}.`,
    pickFirst: () => hi ? "पहले कोई विकल्प चुनिए, कार्ड पर टैप कीजिए या बोलिए “पहला”।" : "Pick an option first, tap a card or say “first”.",
    nothingToConfirm: () => hi ? "अभी कन्फर्म करने को कुछ नहीं है। कहाँ जाना है?" : "There's nothing to confirm yet. Where would you like to go?",
    booked: b => hi ? `बुक हो गया। ${b.title}, PNR ${b.pnr}। ${rupees(b.fare)} UPI से भुगतान हुआ (डेमो)।` : `Booked. ${b.title}, PNR ${b.pnr}. Paid ${rupees(b.fare)} via UPI (demo).`,
    bookingDropped: () => hi ? "ठीक है, बुक नहीं किया। कोई दूसरा विकल्प देखें?" : "Okay, not booked. Want another option?",
    cancelDropped: () => hi ? "ठीक है, बुकिंग जैसी थी वैसी ही है।" : "Okay, your booking stays as it is.",
    okay: () => hi ? "ठीक है। और कुछ?" : "Okay. Anything else?",
    noBookings: () => hi ? "अभी कोई बुकिंग नहीं है। पहले कुछ बुक कीजिए, जैसे “कल दिल्ली से मुंबई फ्लाइट”।" : "No bookings yet. Book something first, like “Delhi to Mumbai flight tomorrow”.",
    status: b => hi ? `${b.title}, PNR ${b.pnr}, कन्फर्म है। ${b.kind === "hotel" ? "चेक-इन" : "यात्रा"} ${when(b.date)}।` : `${b.title}, PNR ${b.pnr} is confirmed for ${when(b.date)}.`,
    askCancel: b => hi ? `${b.title}, PNR ${b.pnr} (${rupees(b.fare)}) कैंसिल कर दूँ?` : `Cancel ${b.title}, PNR ${b.pnr} (${rupees(b.fare)})?`,
    cancelled: b => `${hi ? "कैंसिल हो गया।" : "Cancelled."} ${REFUND[L][b.kind]} ${hi ? "(डेमो)" : "(demo)"}`,
    askNewDate: b => hi ? `${b.title} के लिए नई तारीख बताइए, जैसे “परसों”।` : `What's the new date for ${b.title}? For example “day after tomorrow”.`,
    // Labels for the trip bar the UI keeps on screen.
    trip: s => s && (s.to || s.vertical) ? {
      route: s.vertical === "hotel" ? (s.to ? place(s.to) : null) : [s.from, s.to].filter(Boolean).map(place).join(" → ") || null,
      date: REL[L][daysFromToday(s.date)] ? `${REL[L][daysFromToday(s.date)].replace(/^./, c => c.toUpperCase())}, ${day(s.date)}` : day(s.date),
      mode: s.vertical || "all", modeLabel: s.vertical ? cap(NOUN[L][s.vertical][0]) : (hi ? "सभी साधन" : "All modes"),
      budget: s.budget ? (hi ? `${rupees(s.budget)} तक` : `Under ${rupees(s.budget)}`) : null
    } : null,
    policyMiss: () => hi ? "यह जानकारी मेरे पॉलिसी नॉलेज बेस में नहीं है।" : "I don't have that in my policy knowledge base.",

    // Chips: label shown, text sent.
    starters: () => hi ? [chip("कल दिल्ली से मुंबई फ्लाइट"), chip("दिल्ली से जयपुर बस"), chip("गोवा में होटल"), chip("ट्रैवल पास क्या है?")]
      : [chip("Delhi to Mumbai flight tomorrow"), chip("Delhi to Jaipur bus"), chip("Hotels in Goa"), chip("What is Travel Pass?")],
    placeChips: cities => cities.slice(0, 4).map(c => chip(place(c))),
    hotelCityChips: () => HOTEL_CITIES.map(c => chip(place(c))),
    optionChips: n => (hi ? ["पहला", "दूसरा", "तीसरा"] : ["First", "Second", "Third"]).slice(0, n).map((l, i) => chip(l, hi ? l : String(i + 1))),
    confirmChips: () => hi ? [chip("हाँ, बुक करो", "हाँ"), chip("नहीं")] : [chip("Yes, book it", "yes"), chip("No", "no")],
    cancelChips: () => hi ? [chip("हाँ, कैंसिल करो", "हाँ"), chip("नहीं")] : [chip("Yes, cancel", "yes"), chip("No", "no")],
    dateChips: from => [1, 2, 3].map(n => addDays(from, n)).map(d => chip(relDay(d), hi ? relDay(d) : (REL.en[daysFromToday(d)] || `${+d.slice(8)} november`))),
    resultChips(s, alt){
      const next = addDays(s.date, 1);
      const nextLabel = hi ? `${relDay(next)} का` : (daysFromToday(next) === 1 ? "Tomorrow" : `${day(next)}`);
      const nextText = hi ? relDay(next) : (REL.en[daysFromToday(next)] || `${+next.slice(8)} november`);
      return [
        s.vertical === "train" && s.sort !== "cheapest" ? chip(hi ? "सबसे सस्ती" : "Cheapest", hi ? "सबसे सस्ता" : "cheapest") : null, // others already list cheapest first
        chip(nextLabel, nextText),
        ...alt.verticals.map(v => chip(hi ? `${NOUN.hi[v][0]} दिखाओ` : `Show ${noun(v)}`, hi ? `${NOUN.hi[v][0]} दिखाओ` : v)),
        s.vertical !== "hotel" && HOTEL_CITIES.includes(s.to) ? chip(hi ? `${place(s.to)} में होटल` : `Hotels in ${place(s.to)}`, hi ? "होटल भी" : "hotel") : null
      ].filter(Boolean);
    },
    compareChips: (s, groups) => [
      ...groups.map(g => chip(hi ? `सिर्फ़ ${noun(g.vertical)}` : `Only ${noun(g.vertical)}`, hi ? `${NOUN.hi[g.vertical][0]} दिखाओ` : g.vertical)),
      HOTEL_CITIES.includes(s.to) ? chip(hi ? `${place(s.to)} में होटल` : `Hotels in ${place(s.to)}`, hi ? "होटल भी" : "hotel") : null
    ].filter(Boolean),
    noRouteChips(s, alt){
      if (s.vertical === "hotel") return HOTEL_CITIES.map(c => chip(place(c), place(c)));
      if (!s.vertical) return alt.routes.map(r => chip(`${place(r.from)} → ${place(r.to)}`, hi ? `${place(r.from)} से ${place(r.to)}` : `${cap(r.from)} to ${cap(r.to)}`));
      return [...alt.verticals.map(v => chip(hi ? `${NOUN.hi[v][0]} दिखाओ` : `Show ${noun(v)}`, hi ? `${NOUN.hi[v][0]} दिखाओ` : v)),
        ...alt.routes.map(r => chip(`${place(r.from)} → ${place(r.to)}`, hi ? `${place(r.from)} से ${place(r.to)} ${NOUN.hi[s.vertical][0]}` : `${cap(r.from)} to ${cap(r.to)} ${s.vertical}`))];
    },
    afterBooking: b => [
      b.kind !== "hotel" && HOTEL_CITIES.includes(b.search?.to) ? chip(hi ? `${place(b.search.to)} में होटल` : `Hotels in ${place(b.search.to)}`, hi ? "होटल भी" : "hotel") : null,
      b.kind !== "hotel" ? chip(hi ? "वापसी का टिकट" : "Return trip", hi ? "वापसी" : "return") : null,
      chip(hi ? "PNR स्टेटस" : "PNR status", "pnr status"),
      chip(hi ? "कैंसिल करो" : "Cancel", "cancel karo")
    ].filter(Boolean)
  };
}

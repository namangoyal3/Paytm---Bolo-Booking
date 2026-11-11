// UI strings and DOM builders. Everything is built with textContent, never innerHTML: replies and
// card fields come from the server (and Claude), so they are treated as untrusted text.
export const STR = {
  hi: {
    tabFlight: "फ्लाइट", tabBus: "बस", tabTrain: "ट्रेन", tabHotel: "होटल",
    from: "कहाँ से", to: "कहाँ तक", city: "शहर", choose: "बोलिए या चुनिए", swap: "वापसी का रूट",
    tabSend: { flight: "फ्लाइट दिखाओ", bus: "बस दिखाओ", train: "ट्रेन दिखाओ", hotel: "होटल दिखाओ" }, swapSend: "वापसी",
    traceTitle: "किस एजेंट ने जवाब दिया", traceEmpty: "बातचीत शुरू होते ही यहाँ दिखेगा।",
    note: "Paytm Checkin के लिए कॉन्सेप्ट डेमो। सैंपल डेटा, नकली भुगतान। हर बात पहले ऑर्केस्ट्रेटर समझता है, फिर सही एजेंट को सौंपता है।",
    placeholder: "लिखें या माइक दबाकर बोलें", listening: "सुन रहा हूँ…",
    hintIdle: "माइक दबाकर बोलिए। रुकते ही भेज दूँगा।", hintListening: "बोलिए। दोबारा दबाने पर रुक जाएगा।",
    hintSpeaking: "बीच में बोलना हो तो माइक दबाइए।", hintNoVoice: "इस ब्राउज़र में आवाज़ से बात नहीं होती। Chrome में खोलिए या लिखिए।",
    hintMicDenied: "माइक की अनुमति नहीं मिली। ब्राउज़र सेटिंग में माइक चालू कीजिए।", hintNoSpeech: "कुछ सुनाई नहीं दिया। फिर से माइक दबाइए।",
    hintNoMic: "कोई माइक नहीं मिला। माइक जोड़कर फिर कोशिश कीजिए।", hintNetwork: "आवाज़ पहचानने की सेवा से संपर्क नहीं हुआ। इंटरनेट देखिए।",
    hintMicFailed: "माइक शुरू नहीं हो पाया।",
    helloTitle: "बोलकर टिकट बुक करें", helloBody: "ट्रेन, फ्लाइट, बस और होटल। हिंदी या अंग्रेज़ी में बोलिए, PNR और कैंसिलेशन भी यहीं।",
    tryTitle: "ऐसे बोलकर देखिए",
    starters: [["airplane-tilt", "कल दिल्ली से मुंबई फ्लाइट", "फ्लाइट, कल"], ["path", "परसों जयपुर जाना है", "ट्रेन, फ्लाइट और बस की तुलना"],
      ["bed", "गोवा में होटल", "होटल, आज चेक-इन"], ["question", "ट्रैवल पास क्या है?", "पॉलिसी का सवाल"]],
    thinking: "सोच रहा हूँ", error: "कुछ गड़बड़ हो गई। फिर से कोशिश कीजिए।", offline: "सर्वर से संपर्क नहीं हो पाया।", retry: "फिर से भेजें",
    replay: "फिर से सुनें", voiceOn: "जवाब बोलकर सुनाना बंद करें", voiceOff: "जवाब बोलकर सुनाएँ", mic: "बोलकर पूछें", micStop: "सुनना बंद करें",
    send: "भेजें", option: n => `विकल्प ${n}`, language: "भाषा",
    agents: { orchestrator: "बोलो", train: "ट्रेन एजेंट", flight: "फ्लाइट एजेंट", bus: "बस एजेंट", hotel: "होटल एजेंट", post: "मेरी बुकिंग", policy: "पॉलिसी एजेंट" },
    engines: { claude: "Claude", instant: "तुरंत", keyword: "ऑफ़लाइन" },
    nonstop: "नॉन-स्टॉप", zeroFee: "₹0 कन्वीनियंस फीस", odds: "कन्फर्म की संभावना", night: "प्रति रात", breakfast: "नाश्ता शामिल",
    assured: "Paytm Assured", stars: n => `${n} स्टार`, nextDay: "+1 दिन", perPerson: "प्रति यात्री",
    booked: "बुकिंग कन्फर्म", bookedSub: "टिकट और PNR आपके फ़ोन पर भेज दिए गए (डेमो)", pnr: "PNR", date: "यात्रा", checkin: "चेक-इन",
    passenger: "यात्री", guest: "मेहमान", paid: "भुगतान", via: "UPI से", source: "स्रोत", locale: "hi-IN", speech: "hi-IN"
  },
  en: {
    tabFlight: "Flights", tabBus: "Bus", tabTrain: "Trains", tabHotel: "Hotels",
    from: "From", to: "To", city: "City", choose: "Say or pick", swap: "Swap for return trip",
    tabSend: { flight: "flight", bus: "bus", train: "train", hotel: "hotel" }, swapSend: "return",
    traceTitle: "Which agent answered", traceEmpty: "Shows up once you start talking.",
    note: "Concept demo for Paytm Checkin. Sample data, mock payments. The orchestrator reads every message first, then hands it to the right agent.",
    placeholder: "Type or tap the mic to speak", listening: "Listening…",
    hintIdle: "Tap the mic and speak. I send when you pause.", hintListening: "Go ahead. Tap again to stop.",
    hintSpeaking: "Tap the mic to interrupt.", hintNoVoice: "Voice does not work in this browser. Open it in Chrome, or type.",
    hintMicDenied: "Microphone access is blocked. Allow it in the browser settings.", hintNoSpeech: "I didn't catch that. Tap the mic again.",
    hintNoMic: "No microphone found. Connect one and try again.", hintNetwork: "Couldn't reach the speech service. Check your internet.",
    hintMicFailed: "The mic didn't start.",
    helloTitle: "Book tickets by voice", helloBody: "Trains, flights, buses and hotels. Speak in Hindi or English. PNR status and cancellations too.",
    tryTitle: "Try saying",
    starters: [["airplane-tilt", "Delhi to Mumbai flight tomorrow", "Flight, tomorrow"], ["path", "Jaipur day after tomorrow", "Compares train, flight and bus"],
      ["bed", "Hotels in Goa", "Hotel, check-in today"], ["question", "What is Travel Pass?", "Policy question"]],
    thinking: "Thinking", error: "Something went wrong. Please try again.", offline: "Couldn't reach the server.", retry: "Send again",
    replay: "Play again", voiceOn: "Stop reading replies aloud", voiceOff: "Read replies aloud", mic: "Ask by voice", micStop: "Stop listening",
    send: "Send", option: n => `Option ${n}`, language: "Language",
    agents: { orchestrator: "Bolo", train: "Train agent", flight: "Flight agent", bus: "Bus agent", hotel: "Hotel agent", post: "My bookings", policy: "Policy agent" },
    engines: { claude: "Claude", instant: "Instant", keyword: "Offline" },
    nonstop: "Non-stop", zeroFee: "₹0 convenience fee", odds: "confirmation odds", night: "per night", breakfast: "Breakfast included",
    assured: "Paytm Assured", stars: n => `${n}-star`, nextDay: "+1 day", perPerson: "per person",
    booked: "Booking confirmed", bookedSub: "Ticket and PNR sent to your phone (demo)", pnr: "PNR", date: "Travel", checkin: "Check-in",
    passenger: "Passenger", guest: "Guest", paid: "Paid", via: "via UPI", source: "Source", locale: "en-IN", speech: "en-IN"
  }
};

export const AGENT_ICON = { orchestrator: "waveform", train: "train", flight: "airplane-tilt", bus: "bus", hotel: "bed", post: "ticket", policy: "book-open-text", all: "path" };

export function el(tag, props = {}, ...kids){
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)){
    if (v == null || v === false) continue;
    if (k === "class") n.className = v;
    else if (k === "text") n.textContent = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? "" : v);
  }
  n.append(...kids.flat().filter(k => k != null && k !== false));
  return n;
}
export const icon = (name, fill = false) => el("i", { class: `${fill ? "ph-fill" : "ph"} ph-${name}`, "aria-hidden": "true" });
export const inr = n => `₹${Number(n).toLocaleString("en-IN")}`;
const cap = s => String(s || "").replace(/\b[a-z]/g, c => c.toUpperCase());
export const fmtDate = (iso, s) => new Date(`${iso}T12:00:00`).toLocaleDateString(s.locale, { weekday: "short", day: "numeric", month: "short" });

function leg(r, from, to, s, mid){
  return el("div", { class: "leg" },
    el("div", { class: "leg-end" }, el("b", { class: "num", text: r.dep }), el("span", { text: from })),
    el("div", { class: "leg-mid" }, el("span", { text: mid ? `${r.dur}, ${mid}` : r.dur })),
    el("div", { class: "leg-end" }, el("b", { class: "num", text: r.arr }), el("span", { text: r.arr < r.dep ? `${to} ${s.nextDay}` : to })));
}
const head = (iconName, name, sub, price, unit) => el("div", { class: "opt-head" },
  el("div", { class: "opt-name" }, el("b", {}, icon(iconName), name), sub ? el("small", { text: sub }) : null),
  el("div", { class: "opt-price num" }, inr(price), unit ? el("small", { text: unit }) : null));

function optionBody(o, s){
  const r = o.raw;
  if (o.kind === "flight") return [head("airplane-tilt", r.airline, r.no, o.price, s.perPerson),
    leg(r, r.from, r.to, s, r.nonstop ? s.nonstop : null),
    el("div", { class: "opt-foot" }, el("span", { class: "save" }, icon("seal-check", true), s.zeroFee))];
  if (o.kind === "train"){
    const cls = Object.entries(r.classes).find(([, v]) => v === o.price)?.[0];
    return [head("train", r.name, r.no, o.price, cls), leg(r, r.from, r.to, s),
      el("div", { class: "opt-foot" },
        el("span", { class: "odds" }, el("span", { class: "odds-bar", "aria-hidden": "true" }, el("i", { style: `width:${Math.max(0, Math.min(100, +r.odds))}%` })), `${r.odds}% ${s.odds}`),
        ...Object.entries(r.classes).filter(([k]) => k !== cls).map(([k, v]) => el("span", { class: "tag num", text: `${k} ${inr(v)}` })))];
  }
  if (o.kind === "bus") return [head("bus", r.operator, r.type, o.price, s.perPerson), leg(r, cap(r.fromCity), cap(r.toCity), s),
    el("div", { class: "opt-foot" }, el("span", {}, icon("star", true), ` ${r.rating}`),
      r.assured ? el("span", { class: "tag ok" }, s.assured) : null)];
  return [head("bed", r.name, `${r.area}, ${s.stars(r.stars)}`, o.price, s.night),
    el("div", { class: "opt-foot" }, el("span", {}, icon("star", true), ` ${r.rating}`), r.breakfast ? el("span", { class: "tag ok" }, s.breakfast) : null)];
}

export function renderOptions(cards, s, onPick){
  return el("div", { class: "options" }, cards.map((o, i) =>
    el("button", { type: "button", class: "opt", "aria-label": `${s.option(i + 1)}: ${o.title}, ${inr(o.price)}`, onclick: () => onPick(i) },
      el("span", { class: "opt-n num", "aria-hidden": "true", text: String(i + 1) }), ...optionBody(o, s))));
}

export function renderPass(b, s){
  const r = b.raw || {}, hotel = b.kind === "hotel";
  const route = hotel || !r.dep ? null : leg(r, r.from || cap(r.fromCity), r.to || cap(r.toCity), s);
  const item = (dt, dd, cls) => el("div", {}, el("dt", { text: dt }), el("dd", { class: cls, text: dd }));
  return el("section", { class: "pass", "aria-label": `${s.booked}: ${b.title}` },
    el("div", { class: "pass-top" }, icon("check-circle", true), el("div", {}, el("b", { text: s.booked }), el("span", { text: s.bookedSub }))),
    el("div", { class: "pass-body" }, el("div", { class: "pass-title", text: hotel ? `${r.name || b.title}, ${r.area || ""}` : b.title }), route),
    el("div", { class: "pass-cut", "aria-hidden": "true" }),
    el("dl", { class: "pass-grid" },
      item(s.pnr, b.pnr, "pnr"),
      item(hotel ? s.checkin : s.date, fmtDate(b.date, s)),
      item(hotel ? s.guest : s.passenger, b.passenger),
      item(s.paid, `${inr(b.fare)} ${s.via}`)));
}

export function renderHello(s, onPick){
  return el("section", { class: "hello", id: "hello" },
    el("h1", { text: s.helloTitle }),
    el("p", { text: s.helloBody }),
    el("h2", { text: s.tryTitle }),
    el("div", { class: "routes" }, s.starters.map(([ic, text, sub]) =>
      el("button", { type: "button", class: "route", onclick: () => onPick(text) },
        el("span", { class: "route-icon" }, icon(ic)), el("span", {}, el("b", { text: `“${text}”` }), el("small", { text: sub })), icon("caret-right")))));
}

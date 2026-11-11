// UI strings and DOM builders. Everything is built with textContent, never innerHTML: replies and
// card fields come from the server (and Claude), so they are treated as untrusted text.
export const STR = {
  hi: {
    tagline: "Paytm Checkin कॉन्सेप्ट डेमो", tripKicker: "आपकी यात्रा", traceTitle: "किस एजेंट ने जवाब दिया",
    traceEmpty: "बातचीत शुरू होते ही यहाँ दिखेगा।",
    note: "डेमो: सैंपल डेटा, नकली भुगतान। हर बात पहले ऑर्केस्ट्रेटर समझता है, फिर सही एजेंट को सौंपता है: ट्रेन, फ्लाइट, बस, होटल, बुकिंग या पॉलिसी।",
    placeholder: "लिखिए, जैसे “कल मुंबई जाना है”", listening: "सुन रहा हूँ…",
    hintIdle: "माइक दबाकर बोलिए। रुकते ही भेज दूँगा।", hintListening: "बोलिए। दोबारा दबाने पर रुक जाएगा।",
    hintSpeaking: "बीच में बोलना हो तो माइक दबाइए।", hintNoVoice: "इस ब्राउज़र में आवाज़ से बात नहीं होती। Chrome में खोलिए या लिखिए।",
    hintMicDenied: "माइक की अनुमति नहीं मिली। ब्राउज़र सेटिंग में माइक चालू कीजिए।", hintNoSpeech: "कुछ सुनाई नहीं दिया। फिर से माइक दबाइए।",
    helloTitle: "कहाँ जाना है?",
    helloBody: "माइक दबाइए और हिंदी या अंग्रेज़ी में बोलिए। ट्रेन, फ्लाइट, बस, होटल, PNR स्टेटस और कैंसिलेशन, सब एक ही बातचीत में।",
    starters: [["airplane-tilt", "कल दिल्ली से मुंबई फ्लाइट"], ["path", "परसों जयपुर जाना है"], ["bed", "गोवा में होटल"], ["question", "ट्रैवल पास क्या है?"]],
    thinking: "सोच रहा हूँ", error: "कुछ गड़बड़ हो गई। फिर से कोशिश कीजिए।", offline: "सर्वर से संपर्क नहीं हो पाया।", retry: "फिर से भेजें",
    replay: "फिर से सुनें", voiceOn: "जवाब बोलकर सुनाना बंद करें", voiceOff: "जवाब बोलकर सुनाएँ", mic: "बोलकर पूछें", micStop: "सुनना बंद करें",
    send: "भेजें", option: n => `विकल्प ${n}`, language: "भाषा",
    agents: { orchestrator: "बोलो", train: "ट्रेन एजेंट", flight: "फ्लाइट एजेंट", bus: "बस एजेंट", hotel: "होटल एजेंट", post: "मेरी बुकिंग", policy: "पॉलिसी एजेंट" },
    engines: { claude: "Claude", instant: "तुरंत", keyword: "ऑफ़लाइन" },
    nonstop: "नॉन-स्टॉप", zeroFee: "कोई कन्वीनियंस फीस नहीं", odds: "कन्फर्म की संभावना", night: "/रात", breakfast: "नाश्ता शामिल",
    assured: "Paytm Assured", stars: n => `${n} स्टार`, nextDay: "+1 दिन",
    booked: "बुक हो गया", confirmed: "कन्फर्म", pnr: "PNR", date: "यात्रा", checkin: "चेक-इन", passenger: "यात्री", guest: "मेहमान",
    paid: "भुगतान", via: "UPI से (डेमो)", source: "स्रोत", locale: "hi-IN", speech: "hi-IN"
  },
  en: {
    tagline: "Paytm Checkin concept demo", tripKicker: "Your trip", traceTitle: "Which agent answered",
    traceEmpty: "Shows up once you start talking.",
    note: "Demo: sample data, mock payments. The orchestrator reads every message first, then hands it to the right agent: train, flight, bus, hotel, bookings or policy.",
    placeholder: "Type, like “Mumbai tomorrow”", listening: "Listening…",
    hintIdle: "Tap the mic and speak. I send when you pause.", hintListening: "Go ahead. Tap again to stop.",
    hintSpeaking: "Tap the mic to interrupt.", hintNoVoice: "Voice does not work in this browser. Open it in Chrome, or type.",
    hintMicDenied: "Microphone access is blocked. Allow it in the browser settings.", hintNoSpeech: "I didn't catch that. Tap the mic again.",
    helloTitle: "Where to next?",
    helloBody: "Tap the mic and speak in Hindi or English. Trains, flights, buses, hotels, PNR status and cancellations, all in one conversation.",
    starters: [["airplane-tilt", "Delhi to Mumbai flight tomorrow"], ["path", "Jaipur day after tomorrow"], ["bed", "Hotels in Goa"], ["question", "What is Travel Pass?"]],
    thinking: "Thinking", error: "Something went wrong. Please try again.", offline: "Couldn't reach the server.", retry: "Send again",
    replay: "Play again", voiceOn: "Stop reading replies aloud", voiceOff: "Read replies aloud", mic: "Ask by voice", micStop: "Stop listening",
    send: "Send", option: n => `Option ${n}`, language: "Language",
    agents: { orchestrator: "Bolo", train: "Train agent", flight: "Flight agent", bus: "Bus agent", hotel: "Hotel agent", post: "My bookings", policy: "Policy agent" },
    engines: { claude: "Claude", instant: "Instant", keyword: "Offline" },
    nonstop: "Nonstop", zeroFee: "Zero convenience fee", odds: "confirmation odds", night: "/night", breakfast: "Breakfast included",
    assured: "Paytm Assured", stars: n => `${n}-star`, nextDay: "+1 day",
    booked: "Booked", confirmed: "Confirmed", pnr: "PNR", date: "Travel", checkin: "Check-in", passenger: "Passenger", guest: "Guest",
    paid: "Paid", via: "via UPI (demo)", source: "Source", locale: "en-IN", speech: "en-IN"
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

function leg(r, from, to, s){
  return el("div", { class: "leg" },
    el("div", { class: "leg-end" }, el("b", { class: "num", text: r.dep }), el("span", { text: from })),
    el("div", { class: "leg-mid" }, el("span", { text: r.dur })),
    el("div", { class: "leg-end" }, el("b", { class: "num", text: r.arr }), el("span", { text: r.arr < r.dep ? `${to} ${s.nextDay}` : to })));
}
const head = (iconName, name, sub, price, unit) => el("div", { class: "opt-head" },
  el("span", { class: "opt-name" }, icon(iconName), el("span", { text: name }), sub ? el("small", { text: sub }) : null),
  el("span", { class: "opt-price num" }, inr(price), unit ? el("small", { text: ` ${unit}` }) : null));

function optionBody(o, s){
  const r = o.raw;
  if (o.kind === "flight") return [head("airplane-tilt", r.airline, r.no, o.price), leg(r, r.from, r.to, s),
    el("div", { class: "opt-foot" }, r.nonstop ? el("span", { class: "tag" }, s.nonstop) : null, el("span", { text: s.zeroFee }))];
  if (o.kind === "train"){
    const cls = Object.entries(r.classes).find(([, v]) => v === o.price)?.[0];
    return [head("train", r.name, r.no, o.price, cls), leg(r, r.from, r.to, s),
      el("div", { class: "opt-foot" },
        el("span", { class: "odds" }, el("span", { class: "odds-bar", "aria-hidden": "true" }, el("i", { style: `width:${Math.max(0, Math.min(100, +r.odds))}%` })), `${r.odds}% ${s.odds}`),
        ...Object.entries(r.classes).filter(([k]) => k !== cls).map(([k, v]) => el("span", { class: "num", text: `${k} ${inr(v)}` })))];
  }
  if (o.kind === "bus") return [head("bus", r.operator, null, o.price), leg(r, cap(r.fromCity), cap(r.toCity), s),
    el("div", { class: "opt-foot" }, el("span", { text: r.type }), el("span", {}, icon("star", true), ` ${r.rating}`),
      r.assured ? el("span", { class: "tag ok" }, icon("shield-check", true), s.assured) : null)];
  return [head("bed", r.name, null, o.price, s.night),
    el("div", { class: "opt-foot" }, el("span", {}, icon("map-pin"), ` ${r.area}`), el("span", { text: s.stars(r.stars) }),
      el("span", {}, icon("star", true), ` ${r.rating}`), r.breakfast ? el("span", { class: "tag ok" }, s.breakfast) : null)];
}

export function renderOptions(cards, s, onPick){
  return el("div", { class: "options" }, cards.map((o, i) =>
    el("button", { type: "button", class: "opt", "aria-label": `${s.option(i + 1)}: ${o.title}, ${inr(o.price)}`, onclick: () => onPick(i) },
      el("span", { class: "opt-n num", "aria-hidden": "true", text: String(i + 1) }), ...optionBody(o, s))));
}

export function renderPass(b, s){
  const r = b.raw || {}, hotel = b.kind === "hotel";
  const route = hotel || !r.dep ? null : leg(r, r.from || cap(r.fromCity), r.to || cap(r.toCity), s);
  const item = (dt, dd, cls) => [el("dt", { text: dt }), el("dd", { class: cls, text: dd })];
  return el("section", { class: "pass", "aria-label": `${s.booked}: ${b.title}` },
    el("div", { class: "pass-top" }, el("b", {}, icon("check-circle", true), s.booked), el("span", { text: s.confirmed })),
    el("div", { class: "pass-body" }, el("div", { class: "pass-title", text: hotel ? `${r.name || b.title}, ${r.area || ""}` : b.title }), route),
    el("div", { class: "pass-cut", "aria-hidden": "true" }),
    el("dl", { class: "pass-grid" },
      el("div", {}, ...item(s.pnr, b.pnr, "pnr")),
      el("div", {}, ...item(hotel ? s.checkin : s.date, fmtDate(b.date, s))),
      el("div", {}, ...item(hotel ? s.guest : s.passenger, b.passenger)),
      el("div", {}, ...item(s.paid, `${inr(b.fare)} ${s.via}`))));
}

export function renderHello(s, onPick){
  return el("section", { class: "hello", id: "hello" },
    el("h1", { text: s.helloTitle }),
    el("p", { text: s.helloBody }),
    el("div", { class: "starters" }, s.starters.map(([ic, text]) =>
      el("button", { type: "button", class: "starter", onclick: () => onPick(text) }, icon(ic), el("span", { text })))));
}

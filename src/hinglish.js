// Chrome's Hindi (hi-IN) speech recognition returns Devanagari ("दिल्ली से मुंबई फ्लाइट"), but routing and
// the keyword parser match Hinglish in Latin script ("delhi se mumbai flight"). Map the words they need;
// all other words pass through unchanged (Claude reads them fine).
const PHRASES = [
  ["के अंदर", "ke andar"], ["जी हां", "haan"], ["जी हाँ", "haan"], ["ठीक है", "theek hai"], ["रहने दो", "rehne do"],
  ["मत करो", "mat karo"], ["ट्रैवल पास", "travel pass"], ["हवाई जहाज", "flight"], ["एयर इंडिया", "air india"], ["नई दिल्ली", "delhi"]
];
const GROUPS = {
  flight: "फ्लाइट फ्लाइट्स फ्लाइटें फ्लाइटस उड़ान विमान हवाई प्लेन", indigo: "इंडिगो", vistara: "विस्तारा", akasa: "अकासा",
  train: "ट्रेन ट्रेनें ट्रेनों ट्रैन रेल रेलगाड़ी", rajdhani: "राजधानी", shatabdi: "शताब्दी", tatkal: "तत्काल",
  bus: "बस बसें बसों", volvo: "वोल्वो", sleeper: "स्लीपर",
  hotel: "होटल होटलों होटल्स", room: "कमरा कमरे रूम", resort: "रिसॉर्ट", lodge: "लॉज", stay: "रुकना ठहरना",
  cancel: "कैंसिल कैंसल रद्द", refund: "रिफंड", pnr: "पीएनआर", status: "स्टेटस", change: "चेंज बदलना बदलो बदल",
  policy: "पॉलिसी", fee: "फीस शुल्क", charge: "चार्ज", convenience: "कन्वीनियंस",
  delhi: "दिल्ली", mumbai: "मुंबई मुम्बई बॉम्बे बंबई", jaipur: "जयपुर", bangalore: "बेंगलुरु बेंगलुरू बैंगलोर बंगलौर बेंगलूर",
  goa: "गोवा", lucknow: "लखनऊ", pune: "पुणे पूना", hyderabad: "हैदराबाद", chennai: "चेन्नई", kolkata: "कोलकाता",
  ahmedabad: "अहमदाबाद", chandigarh: "चंडीगढ़", varanasi: "वाराणसी बनारस", amritsar: "अमृतसर", udaipur: "उदयपुर",
  agra: "आगरा", kochi: "कोच्चि", indore: "इंदौर", bhopal: "भोपाल", patna: "पटना", manali: "मनाली", shimla: "शिमला",
  rishikesh: "ऋषिकेश", dehradun: "देहरादून",
  se: "से", tak: "तक", andar: "अंदर", budget: "बजट", mein: "में", to: "टू", ko: "को", bhi: "भी", ka: "का", ki: "की", ke: "के",
  aaj: "आज", kal: "कल", parso: "परसों", subah: "सुबह", shaam: "शाम", november: "नवंबर नवम्बर", tarikh: "तारीख",
  jaana: "जाना", jaane: "जाने", hai: "है", chahiye: "चाहिए", dikhao: "दिखाओ दिखाइए दिखाना दिखा", wala: "वाला वाली वाले",
  sabse: "सबसे", sasta: "सस्ता सस्ती सस्ते", jaldi: "जल्दी", wapsi: "वापसी वापस", return: "रिटर्न",
  karo: "करो करिए कीजिए", kya: "क्या", kitna: "कितना कितनी कितने", kab: "कब", ticket: "टिकट",
  haan: "हां हाँ हा", nahi: "नहीं नही", yes: "यस", no: "नो", ok: "ओके", confirm: "कन्फर्म", book: "बुक",
  namaste: "नमस्ते नमस्कार", hello: "हेलो हैलो", hi: "हाय", thanks: "धन्यवाद शुक्रिया थैंक्स",
  pehla: "पहला पहली पहले", doosra: "दूसरा दूसरी दूसरे", teesra: "तीसरा तीसरी तीसरे"
};
const WORDS = Object.fromEntries(Object.entries(GROUPS).flatMap(([en, hi]) => hi.split(" ").map(w => [w, en])));

export function toHinglish(text){
  let t = String(text || "")
    .replace(/[०-९]/g, d => "०१२३४५६७८९".indexOf(d))  // Devanagari digits
    .replace(/(\d),(?=\d)/g, "$1");                     // 5,000 / 1,00,000 -> plain number
  for (const [hi, en] of PHRASES) t = t.split(hi).join(en);
  return t.split(/(\s+)/).map(w => {
    const core = w.replace(/[।?!.,]+$/, "");
    return WORDS[core] ? WORDS[core] + w.slice(core.length) : w;
  }).join("");
}

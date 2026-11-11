// Turns on-screen reply text into words a TTS voice reads cleanly, in the reply's language.
// Raw text made voices say "2026 minus 11 minus 12 colon" and "zero six colon zero zero".
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const clock24 = (h, m) => { h = +h; const ap = h < 12 ? "AM" : "PM"; h = h % 12 || 12; return m === "00" ? `${h} ${ap}` : `${h} ${m} ${ap}`; };

export function toSpeech(t, lang = "en"){
  const hi = lang === "hi";
  const money = n => `${n.replace(/,/g, "")} ${hi ? "रुपये" : "rupees"}`;
  return t
    .replace(/\n+Source:[\s\S]*$/, "")                                          // KB source line is for the screen
    .replace(/\b\d{4}-(\d{2})-(\d{2})\b/g, (_, m, d) => `${+d} ${MONTHS[m-1]}`)  // 2026-11-12 -> 12 November
    .replace(/\b(\d{1,2}):(\d{2})(\s*[AP]M)\b/g, (_, h, m, ap) => `${h}${m === "00" ? "" : " " + m}${ap}`) // 6:10 AM -> 6 10 AM
    .replace(/\b(\d{1,2}):(\d{2})\b/g, (_, h, m) => hi && +h <= 12          // hi replies already say सुबह/शाम
      ? (m === "00" ? `${h} बजे` : `${h} बजकर ${+m} मिनट`) : clock24(h, m))    // 16:25 -> 4 25 PM
    .replace(/\b(\d+)h\b/g, "$1 hours").replace(/\b(\d+)m\b/g, "$1 minutes")
    .replace(/₹\s*(\d[\d,]*\d|\d)/g, (_, n) => money(n)).replace(/\bRs\.?\s*(\d[\d,]*\d|\d)/g, (_, n) => money(n))
    .replace(/\/night\b/g, " per night")
    .replace(/\bCNF\b/g, "confirmed")
    .replace(/\b(?=[A-Z0-9]*[A-Z])[A-Z0-9]{3,6}\b/g, c => c.split("").join(" ")) // NDLS, PNR codes: spell out
    .replace(/\s*->\s*|\s*→\s*/g, hi ? " से " : " to ")
    .replace(/(\w)-(\w)/g, "$1 $2")                                              // 6E-2134, Delhi-Mumbai
    .replace(/["“”]/g, "")
    .replace(/[:;()·|]|\s[-–—]\s/g, ", ")
    .replace(/\s*,[\s,]*/g, ", ").replace(/,\s*([.?!।])/g, "$1").replace(/([.?!।]),/g, "$1")
    .replace(/^[,\s]+|[,\s]+$/g, "").replace(/\s+/g, " ");
}

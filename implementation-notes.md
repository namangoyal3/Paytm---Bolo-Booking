# Implementation notes — conversation brain, voice flow, visual redesign (2026-11-11)

Live build log. Deviations, edge cases and non-obvious decisions only.

- Claude calls stay on the user's own Claude login (no API key, by request). Per-call CLI boot was 12–17 s with the
  user's hooks/MCP/plugins loaded; lean flags + a pre-booted "warm spare" process (one message per process, then a
  fresh spare) brought a Claude turn to ~1.5–2 s without sharing any conversation between turns.
- Chrome's hi-IN speech recognition returns Devanagari. Keyword routing only knew Latin words, so every Hindi voice
  request fell back to the default "train". Fixed once at the entry point (`toHinglish`), not per agent.
- Old design: Claude only extracted slots from the latest message, with no session context, and routing was keyword
  scoring. Follow-ups ("flight dikhao", "parso ka", "sabse sasta"), partial requests and greetings all hit the same
  "Route batayiye" dead end. New design: one Claude call per turn sees the trip state and returns only what the
  message changes; code merges it into the state (merge is deterministic and shared with the offline fallback).
- Replies come from bilingual templates (hi/en), not a second LLM call: a second call would double latency to ~4 s.
  Claude writes text only for greetings/off-topic (`say`, same call) and grounded policy answers (separate warm spare).
- Remembered budget no longer leaks across verticals: a per-night hotel budget hid every flight. Budget now carries
  only within the same vertical, and if it empties a route the app shows the cheapest options and says so.
- No mode named ("kal mumbai jaana hai") now compares train/flight/bus in one answer instead of asking
  "train, flight ya bus?". Live testing showed the question cost a turn and a budget-only reply re-asked it.
- Origin defaults to `prefs.homeCity` when only a destination is given; the reply always names the origin so
  the user can correct it.
- `session.asked` records the slot last asked for, so a bare "गोवा" answers "kahan jaana hai?" as the destination
  (the keyword parser would otherwise read an unmarked city as the origin).
- Instant path: short, unambiguous replies (picks, yes/no, a mode, a date, a city, "sabse sasta") skip Claude.
  Chips send exactly these short texts, so tapping a chip answers in ~0 ms.
- Policy answers use a second warm Claude process (different system prompt). One spare per prompt; a single
  spare keyed to the last prompt would have made every turn after a policy question cold (~5 s).
- Found while testing: PNRs were 5 chars ~18% of the time (`random()*32` over a 31-char alphabet). Fixed.
- Server: malformed JSON or a bad `%` escape in a URL was an unhandled rejection that killed the process
  (Node 22). Both now return 400; static paths are resolved and confined to `public/`.
- Bot reply text had em-dashes in many templates; replaced with commas/colons (UI rule, and TTS read them as pauses
  inconsistently). `toSpeech` is now language-aware: Hindi reads "₹4,350" as "4350 रुपये" and "6:10" as
  "6 बजकर 10 मिनट"; English no longer doubles "AM AM" on times the template already formatted.
- Money regex `[\d,]+` swallowed the comma after an amount ("₹4,350, कोई" -> "4350 रुपये कोई"). Amount must end on
  a digit now. Covered by a speech eval.
- Frontend split into app.js (state, network, voice loop), ui.js (strings + DOM builders), app.css. All DOM is
  built with textContent: replies and card fields come from the server and Claude, so they stay untrusted text.
- Voice loop: tap once (no hold); interim transcript shows live; recognition ends on a pause and sends. TTS reads
  the reply; if it ends in "?" and the last input was voice, the mic reopens. "no-speech" ends hands-free mode,
  so the loop cannot spin. Each utterance carries a sequence id: `speechSynthesis.cancel()` fires the old
  utterance's onend, which would otherwise reopen the mic during barge-in.
- Grid gotcha: the chips row (overflow-x: auto) widened the 1fr grid column on phones (min-width: auto), so the
  whole page scrolled sideways. Column is `minmax(0, 1fr)` now.
- Scroll after chips/trip render, not before: they change the log's height and hid the newest reply.
- Bookings now carry `raw` (the option's data) so the boarding pass can show times and station codes.

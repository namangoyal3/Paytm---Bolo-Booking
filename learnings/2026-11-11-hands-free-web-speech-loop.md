# Hands-free voice loop with the Web Speech API

## The problem

A browser voice assistant needs tap-to-talk, a live transcript, auto-send, a spoken reply, and the mic reopening for an answer. It must not loop forever and must not read symbols aloud ("2026 minus 11 minus 12 colon").

## The approach

1. Clean the spoken text separately from the display text: `toSpeech(text, lang)` in `public/speech.js`.
   - ISO dates become "12 November".
   - Times become "6 10 AM" in English, or "6 बजकर 10 मिनट" in Hindi.
   - `₹4,350` becomes "4350 rupees" in English, or "4350 रुपये" in Hindi.
   - Codes of 3 to 6 capital letters are spelled out ("P N R").
   - Arrows, quotes, brackets and separators become commas.
2. Pin the money regex to end on a digit: `₹\s*(\d[\d,]*\d|\d)`. With `[\d,]+`, the regex ate the comma after the amount and merged two clauses.
3. Use one `SpeechRecognition` per listen: `interimResults = true` and `continuous = false`, so the browser ends on a pause. `onresult` shows the interim text. `onend` sends the final text, or the heard text when the user tapped stop.
4. After the reply, speak it. In `utterance.onend`, reopen the mic only if the last input was voice AND the reply ends with "?".
5. Give each utterance a sequence id and ignore `onend` from older ids. `speechSynthesis.cancel()` fires `onend` on the cancelled utterance, so without this guard, a barge-in reopened the mic twice.
6. Test the loop headless with fakes injected via Playwright `addInitScript`: a fake `SpeechRecognition` that "hears" scripted phrases, and a `speechSynthesis` whose `speak()` calls `onend` after 50 ms. Assert the order listen, speak, listen, speak, and assert that the loop stops after a reply with no question. The fake Hindi flow is "दिल्ली से जयपुर बस", "दूसरा", "हाँ".

## The judgment calls

- No hold-to-talk. Holding a button while speaking a sentence is awkward on phones. Tap starts, a pause or a second tap ends.
- No `continuous = true`. It never ends on its own, so auto-send would need a silence timer.
- A `no-speech` error ends hands-free mode, which reopens the mic only after a question. This stops the loop when nobody answers.
- No cloud TTS. Browser voices cost nothing and need no key. Pick the Google voice for the exact locale when present, else any voice for the language.

## The reusable rule

Speak a cleaned copy of the text, never the display copy. Guard every async speech callback with a sequence id, because `cancel()` fires the old utterance's callbacks.

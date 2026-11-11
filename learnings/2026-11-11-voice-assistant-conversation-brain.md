# Voice booking assistant that forgot context and only returned trains

## The problem

A Hindi/English voice travel assistant (`src/orchestrator.js`) treated every message alone. Follow-ups like "फ्लाइट दिखाओ" or "parso ka" dead-ended in "Route batayiye", and every Hindi voice request returned trains.

## The approach

1. Reproduce with real inputs first. Chrome's `hi-IN` speech recognition returns Devanagari ("दिल्ली से मुंबई फ्लाइट"). The keyword router knew only Latin words, so nothing matched, and the router fell back to its default vertical, "train". The pivotal check was one `console.log` of the raw transcript.
2. Fix it at the single entry point: `toHinglish()` in `src/hinglish.js` maps Devanagari phrases, words and digits to Hinglish before any parsing. Do not add Devanagari keywords to each agent.
3. Split understanding from state. One Claude call per turn (`src/brain.js understand()`) gets a CONTEXT JSON with the trip so far, the options on screen, what awaits confirmation and the last question asked. It returns ONLY what this message changes, for example `{"intent":"search","vertical":"flight"}`. Deterministic code (`mergeTrip()` in the orchestrator) merges that into `session.search`. The offline keyword parser returns the same shape, so both paths share the merge.
4. Treat the model JSON as untrusted. `clean()` keeps known intents, verticals, classes and sorts; dates must be `>= TODAY`; `selection` must index an option on screen.
5. Cut latency. `claude -p` cold-started in 12 to 17 s because it loaded the user's hooks, MCP servers and plugins. These flags fixed that: `--setting-sources "" --strict-mcp-config --tools "" --no-session-persistence --disable-slash-commands`, plus `cwd: tmpdir()`. Then keep one pre-booted `--input-format stream-json` process per system prompt (a "warm spare"). Use it for exactly one message and boot the next spare at once. A turn then takes 1.5 to 2 s.
6. Add an instant path. Short, unambiguous replies (`haan`, `दूसरा`, a mode, a date word, a bare city) skip Claude and resolve in about 0 ms. UI chips send exactly these texts.
7. Lock behaviour with multi-turn evals (`evals/cases.json` "conversation" suite). Each case is a flow of messages plus the expected end state: agent, intent, from/to/date, pending booking, chips.

## The judgment calls

- No second LLM call to write replies. It would double latency to about 4 s. Bilingual templates in `src/replies.js` write all replies, in Devanagari for Hindi so the `hi-IN` voice reads them naturally.
- No shared long-lived Claude session. One message per process keeps users and turns isolated. The orchestrator owns the state, not the model.
- No "train, flight or bus?" question when the user names no mode. Live testing showed that it cost a turn. The app compares all modes in one answer instead.
- A remembered budget does not carry across verticals. A ₹3,000/night hotel budget had hidden every flight. If a remembered budget empties the results, the app relaxes the budget and says so.
- One warm spare per system prompt, not one global spare. A global spare keyed to the last prompt made every turn after a policy question cold (about 5 s).

## The reusable rule

Make the model return the delta of each turn from a context snapshot, merge it deterministically in code, and normalize the input script at the single entry point before any keyword logic.

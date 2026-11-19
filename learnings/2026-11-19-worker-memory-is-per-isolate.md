# Worker memory is per isolate

**Problem.** The live chat lost the trip on follow-up turns. The local server never did.

**Cause.** `src/worker.js` kept sessions in a module-level `Map`. Cloudflare runs many isolates. Each isolate has its own `Map`.

**How I found it.** I sent the same 3-turn flow 8 times to the live URL with a fresh session id each time. 5 runs lost the context. Local evals cannot show this fault.

**Fix.** Route `/api/*` to one Durable Object. Keep a `Map` cache in the object and write each session to `ctx.storage` after each turn.

**Rule.** For each stateful Worker, test a multi-turn flow against the live URL many times. Send the field name that the API reads (`sessionId`, not `sid`); a wrong name puts every test in the `default` session and hides the result.

# AI Architecture

Cloud-based, not on-device — see → [[Offline LLM idea (rejected)]] for why.

- **Model:** Gemini 2.5 Flash-Lite. Cheapest tier sufficient for short text-rewrite tasks (resume bullets). ~₹0.01-0.02 per rewrite. Billing enabled from day one — cost is trivial enough that free-tier-quota-juggling logic isn't worth building.
- **Proxy:** Cloudflare Workers (free tier, 100K requests/day, **no credit card required**). The API key must never live in the client app — it would be extractable from the APK.
  - Chosen over Firebase Functions specifically because Firebase requires adding a credit card and moving to the Blaze plan even to access free-tier usage.
- **UX rule (non-negotiable):** the AI's rewrite is shown alongside the user's original text with explicit Accept / Edit / Keep Original. Never silently auto-applied — same principle used in the LexLint project.
- **Offline degradation:** AI button disabled with a clear "needs internet" message when offline; everything else (manual entry, templates, export) stays fully functional without internet.
- **Hard daily spend cap (real cost control, ships with v1):** the shared-secret header alone is a weak deterrent — it ships inside the APK and can be extracted by decompiling it. What actually bounds financial risk is a separate hard daily request ceiling, a single Cloudflare KV counter (`usage:{date}`, 2-day TTL, no cleanup job needed) incremented per Gemini call and checked before every request. Once hit, the Worker returns "AI unavailable today" without calling Gemini — global circuit breaker, not per-user. See → [[Things To Avoid]] and full contract in `ARCHITECTURE.md`.

Gates usage via → [[Monetization Model]]. Request/response shape → [[API Contracts]].

← back to [[Resume Builder MOC]]

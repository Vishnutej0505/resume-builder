# API Contracts

Full detail in `ARCHITECTURE.md` (project root, Section 4) — this note is the shape to remember while coding.

**App → Worker: `POST /rewrite`**
```
Headers: X-App-Secret: <shared secret>
Body: { sectionType, text }   // text max 2000 chars

200 → { rewrittenText }
400 → { error: "empty_text" | "text_too_long" }
401 → { error: "invalid_secret" }
429 → { error: "daily_cap_reached" }
502 → { error: "upstream_error" }
```

Client rule: **any non-200, or a ~10s client timeout, falls back to the user's original text unchanged.** The user sees one generic retry message regardless of which error code fired — the codes are for your own logs only, never surfaced verbatim. See → [[AI Architecture]].

**Worker internal order:** check secret → validate text → check/increment KV daily counter → build per-`sectionType` prompt → call Gemini → return.

**Play Billing is an SDK event flow, not HTTP** — `requestSubscription(productId)` → `purchaseUpdatedListener` → set `subscriptionActive` locally → `finishTransaction()`. Reconciled against real Play state via `getAvailablePurchases()` on every app launch.

← back to [[Resume Builder MOC]]

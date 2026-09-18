# Architecture & Data Modeling — LOCKED

Companion to `PRD.md` (what/why) and `TRD.md` (stack/library choices). This document is the field-level contract: exact schema, entity relationships, every third-party integration, and every API request/response shape — so no implementation detail needs to be guessed or re-decided while coding.

## 1. System Overview

There is **no application server and no relational database.** All resume data lives on-device. The only server-side piece is one stateless Cloudflare Worker that exists purely to hide the Gemini API key — it holds no user data.

```
┌─────────────────────────┐
│   Expo App (on-device)  │
│                          │
│  AsyncStorage:           │
│   - "resume"   (JSON)    │
│   - "aiUsage"  (JSON)    │
└──────────┬───────────────┘
           │ HTTPS (only for AI rewrite)
           ▼
┌─────────────────────────┐        ┌──────────────────────────┐
│  Cloudflare Worker       │──────▶│  Gemini 3.5 Flash-Lite API │
│  (stateless proxy)       │       └──────────────────────────┘
│  + Cloudflare KV:         │
│    "usage:{date}" counter │
└──────────┬───────────────┘
           │
           ▼ (separate, no data shared)
┌─────────────────────────┐
│  Google Play Billing     │
│  (via react-native-iap)  │
└─────────────────────────┘
```

Three independent systems, deliberately not sharing a database: on-device storage (product data), the Worker+KV (AI proxying + a cost counter only), and Play Billing (subscription truth, owned by Google). Nothing here needs a shared backend because nothing needs to be visible across devices or users — per PRD, this is single-device, single-user data.

## 2. Data Model (on-device, AsyncStorage)

This is an object graph inside two JSON blobs, not relational tables — there is no join, no foreign key, no query engine. Relationships are plain nesting.

### 2.1 Entity relationship (object graph)

```
Resume (singleton)
 └─ 1 ── * ResumeSection
          └─ 1 ── * SectionItem
                   └─ 1 ── * bullet (string)

AIUsage (singleton, unrelated to Resume)
```

Both are singletons — there is exactly one `Resume` and one `AIUsage` record per install, stored under fixed AsyncStorage keys `"resume"` and `"aiUsage"`. No `id` field is needed on either, since there is nothing to distinguish it from (per PRD's deliberate one-master-record model — adding an id would imply a collection that doesn't exist).

### 2.2 `Resume` schema

```ts
{
  schemaVersion: number,        // starts at 1 — see 2.4
  personalInfo: {
    name: string,
    email: string,
    phone: string,
    location: string,
    linkedIn: string | null     // optional, omit gracefully if blank
  },
  sections: ResumeSection[],
  selectedTemplate: string,     // matches a key in src/lib/templates/ (e.g. "classic")
  updatedAt: string             // ISO 8601, set on every save
}
```

**`ResumeSection`:**
```ts
{
  type: "summary" | "education" | "experience" | "projects" | "skills" | "certifications",
  order: number,                // 0-indexed; render order = sort by this
  items: SectionItem[]
}
```

**`SectionItem`:**
```ts
{
  title: string,                // e.g. company name, degree name
  subtitle: string | null,      // e.g. role, institution
  dateRange: string,            // free text ("Jun 2022 – Present", "Summer 2021") —
                                 // deliberately NOT two Date fields; resumes routinely
                                 // have fuzzy/partial/open-ended dates, and structured
                                 // dates would add timezone/parsing work for zero benefit
  bullets: string[]
}
```

**Validation rules (enforced in `src/lib/storage.js` before write, not at the UI layer only):**
- `personalInfo.name` and `personalInfo.email` are the only hard-required fields — export is blocked without them (PRD Section 8, "empty required fields at export").
- `sections` may be empty (a brand-new resume); `items` and `bullets` may be empty arrays, never `null`.
- `order` values are re-sequenced (0..n-1) on every reorder — never trust gaps or duplicates from partially-applied UI state.

### 2.3 `AIUsage` schema

```ts
{
  schemaVersion: number,
  freeCreditsRemaining: number,     // starts at 20, decremented per successful AI rewrite
  subscriptionActive: boolean,       // cached from Play Billing, refreshed at launch + post-purchase
  subscriptionProductId: string | null,
  lastSyncedAt: string               // ISO 8601, last time subscriptionActive was refreshed
}
```

Note: there is **no separate `freeCreditsExhausted` boolean**, even though the original PRD sketch had one — it's a derived value (`freeCreditsRemaining <= 0`) and storing it separately just creates a second source of truth that can drift out of sync with the count it's derived from. Compute it at read time instead.

**Ephemeral tailoring's in-memory shape** (not a schema addition — nothing here is persisted): `ResumeContext` holds a second, nullable `tailoredResume: Resume | null` alongside the persisted master. When non-null (set by "Full Rewrite"), every mutation and the value exposed to screens as `resume` targets the tailored copy instead of the master; the debounced-save effect only ever writes the master. "Discard, back to master" just sets it back to `null`. This is the literal implementation of PRD.md Section 6's "Option A" — no new AsyncStorage key, no new schema version, because the whole point is that a tailored draft never touches disk.

### 2.4 Schema versioning

`schemaVersion` exists on both records from day one, even though there's only one version right now — the day the resume section shape needs to change (a real possibility once templates are built out), old installs already have v1 data on disk with no server to migrate it. A `schemaVersion` field costs one line now; retrofitting version detection into data that was never tagged is a much bigger job later. `storage.js` checks the version on read and no-ops if it matches; a migration function is written only when a version bump actually happens, not preemptively.

## 3. Third-Party Integrations

| Integration | Purpose | Auth | Cost | Data shared |
|---|---|---|---|---|
| **Gemini 3.5 Flash-Lite** (Google) | AI text rewriting | API key, held only in the Worker | ~₹0.01-0.02/call, billed to your Google Cloud account | Section text only, no PII beyond whatever the user typed into that section |
| **Cloudflare Workers** | Proxy that hides the Gemini key from the client | Worker secret (`GEMINI_API_KEY`) + shared header (`APP_SHARED_SECRET`) | Free tier (100K req/day) | Passes through section text; stores nothing itself |
| **Cloudflare KV** | Daily spend-cap counter | Bound to the Worker only, not reachable from the app | Free tier (well within limits for one counter/day) | One integer per date, no user data |
| **Google Play Billing** (`react-native-iap`) | ₹29/month subscription | Handled entirely by Play Store account, no custom auth | Google's standard cut of subscription revenue | Purchase/subscription state only, no resume data |
| **Expo `expo-print`** | HTML → PDF export | None (local, on-device) | Free | None (local rendering) |
| **Expo `expo-sharing` / `expo-file-system`** | Save/share exported files | None (local) | Free | None |
| **`react-native-webview`** | Renders the HTML template for live in-app preview | None (local) | Free | None (renders local HTML string, no navigation to remote URLs) |

Nothing here shares data between integrations — the Worker never sees Play Billing state, Play Billing never sees resume content, and Gemini only ever sees the one section's text being rewritten, not the full resume.

## 4. API Contracts

### 4.1 App → Cloudflare Worker: `POST /rewrite`

**Request**
```
Headers:
  Content-Type: application/json
  X-App-Secret: <APP_SHARED_SECRET>

Body:
{
  "sectionType": "summary" | "education" | "experience" | "projects" | "skills" | "certifications",
  "text": string,             // max 2000 chars, enforced client-side and re-checked server-side
  "jobDescription": string?   // optional, max 6000 chars — present only for "Full Rewrite" (re-tailoring
                               // to a specific job, PRD.md Section 6); folded into the same prompt as
                               // targeting context rather than a separate endpoint/contract
}
```

**Responses**
```
200 OK
{ "rewrittenText": string }

400 Bad Request
{ "error": "empty_text" | "text_too_long" }

401 Unauthorized
{ "error": "invalid_secret" }

429 Too Many Requests
{ "error": "daily_cap_reached" }

502 Bad Gateway
{ "error": "upstream_error" }   // Gemini call failed or timed out
```

Client behavior per PRD Section 8: **any non-200 response, or a client-side fetch timeout (~10s via `AbortController`), falls back to the user's original text unchanged** — the error message shown to the user is generic ("Couldn't get a suggestion, try again") regardless of which of the above codes it was; the distinct codes are for your own debugging/logs, not surfaced verbatim to the user.

### 4.2 Worker internal flow (per request)

1. Check `X-App-Secret` header → 401 if wrong.
2. Validate `text` length/non-empty → 400 if invalid.
3. Read/increment today's KV counter (`usage:{YYYY-MM-DD}`, UTC date, 2-day TTL so old keys self-expire with no cleanup job) → 429 if at cap.
4. Build a prompt from a per-`sectionType` template (`worker/src/prompts.js` — one short template per section type, since a bullet for "experience" and a line for "summary" warrant different instructions) and call Gemini.
5. Return `{ rewrittenText }`, or 502 if the Gemini call fails/times out.

### 4.3 Worker → Gemini API

Fixed external contract (Google's REST `generateContent` endpoint) — not something this project designs, just documented for reference:
```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key={GEMINI_API_KEY}

Body: { "contents": [{ "parts": [{ "text": "<prompt + user's section text>" }] }] }
```
Low temperature (~0.3-0.5) for consistent, professional tone rather than creative variance.

### 4.4 App ↔ Google Play Billing (`react-native-iap`)

Not an HTTP contract — an SDK event interface:
```
Product ID: "resume_builder_monthly_29"

Flow:
  requestSubscription("resume_builder_monthly_29")
    → purchaseUpdatedListener fires on success
    → app sets AIUsage.subscriptionActive = true, subscriptionProductId, lastSyncedAt
    → finishTransaction() (required by react-native-iap, or Play will refund automatically)

On app launch:
  getAvailablePurchases() → reconcile AIUsage.subscriptionActive with actual Play state
  (covers the case where a subscription lapsed/renewed outside the app)
```
No server-side receipt validation for v1 (per TRD Section 8) — the SDK's local purchase state is trusted.

## 5. Key Sequence Flows

**AI rewrite:**
`User taps "Rewrite" → check AIUsage.freeCreditsRemaining > 0 || subscriptionActive locally → if blocked, show paywall/upsell, stop → else POST /rewrite → on 200, show Accept/Edit/Keep Original → on Accept, decrement freeCreditsRemaining (if not subscribed) and write to Resume.sections → on any failure, restore original text, show retry message`

**Export:**
`User taps Export → validate personalInfo.name/email present, block with message if not → render selectedTemplate HTML with current Resume data → PDF: expo-print.printToFileAsync → expo-sharing.shareAsync | Word: docx builds buffer → expo-file-system writes file → expo-sharing.shareAsync`

**Subscribe:**
`User hits paywall (free credits exhausted, wants to re-tailor) → requestSubscription → on success, subscriptionActive = true → re-tailor flow unlocked, ephemeral per PRD (not written back to master Resume)`

## 6. Open Items

Same three as TRD Section 10 — template HTML, KV rate-limit tuning, and IAP config-plugin specifics are implementation details decided when each piece is actually built, not guessed here.

← See also: `PRD.md` (product decisions), `TRD.md` (stack/library rationale), `Vault/WIKI/Data Model.md` (product-level framing of the same schema).

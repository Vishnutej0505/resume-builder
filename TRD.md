# TRD: Resume Builder — Technical Requirements — LOCKED

Companion to `PRD.md`. The PRD says *what* and *why*; this says *how* — stack, libraries, APIs, structure — so implementation doesn't require re-deciding things mid-build. Where PRD decisions constrain the stack, they're cited, not repeated.

## 1. Platform & Runtime

- **Expo SDK 57**, React Native 0.86, React 19 (already scaffolded). Android-first, Play Store target (per PRD).
- **Expo Go works until in-app purchases are added** (Section 7) — `react-native-iap` requires native code Expo Go doesn't ship. At that point switch to an **EAS Development Build**. Don't set up EAS before it's actually needed.
- Always resolve dependency versions with `npx expo install <pkg>`, never a bare `npm install <pkg>` — it picks the version matched to SDK 57 instead of guessing. AGENTS.md's warning applies here: check https://docs.expo.dev/versions/v57.0.0/ for any Expo-namespaced package before adding it, since the API surface has moved across recent SDKs.

## 2. App Architecture

- **No router/navigation library.** The app is one linear flow (data entry → preview → export) plus a settings/paywall surface, not a multi-stack app. A screen-name value in local state (`useState<'entry' | 'preview' | 'settings'>`) covers it. Add `react-navigation` only if the flow later grows tabs/deep-linking — it doesn't today. (Ladder rung 1: this doesn't need to exist yet.)
- **State management: React Context + `useReducer`**, one `ResumeContext` holding the single master resume record (per PRD's one-resume data model — there's no multi-entity state to justify Redux/Zustand/Jotai).
- **Folder structure:**
  ```
  src/
    screens/        (EntryScreen, PreviewScreen, SettingsScreen)
    components/      (SectionEditor, BulletRow, TemplatePreview, ...)
    lib/
      storage.js     (AsyncStorage read/write for Resume + AIUsage)
      ai.js          (fetch wrapper to the Cloudflare Worker proxy)
      ats.js         (deterministic scoring + JD keyword match — pure functions)
      export/
        pdf.js        (expo-print)
        docx.js       (docx library)
      templates/
        classic.js     (HTML/CSS string template — single source of truth for preview + PDF)
    context/
      ResumeContext.js
  worker/            (separate Cloudflare Worker project, not part of the Expo app)
    src/index.js
    wrangler.toml
  ```

## 3. Templates & Rendering

- **One HTML/CSS string is the single source of truth per template**, used for both:
  - **Live preview** — rendered in-app via `react-native-webview`.
  - **PDF export** — the same HTML string passed straight to `expo-print`.
- This avoids maintaining a separate React-Native-component preview that could visually drift from the exported PDF (PRD's "extreme overflow needs real testing" edge case is handled by CSS reflow, once, not twice).
- **Word export stays a genuinely separate pipeline** (`docx` library, building `.docx` primitives from the same resume data object) — per PRD Section 6, this is accepted real work, not a bug to fix. Visual parity between the two is verified manually against real sample data before v1 is called done, not automated (not worth a snapshot-testing setup for two templates).
- Template selection (1-2 templates for v1) is a string key on the resume record (`selectedTemplate`), used to pick which HTML template function runs — no template engine/DSL needed for 1-2 static layouts.

## 4. Local Storage

- **`@react-native-async-storage/async-storage`** — the standard, native-storage-backed key-value store for Expo/RN. Two keys: `resume` (JSON-serialized Resume record) and `aiUsage` (JSON-serialized AIUsage record), matching PRD Section 7's data model exactly. No SQLite/WatermelonDB/Realm — a single JSON blob per record is the whole dataset; a relational or query-capable store would be solving a problem this app doesn't have.
- Every write is debounced/on-blur, not on-keystroke, to avoid excessive AsyncStorage writes during typing.

## 5. AI Integration

- **Model:** Gemini 3.5 Flash-Lite, called from the Cloudflare Worker (never from the app) via Google's standard REST `generateContent` endpoint — plain `fetch`, no Google SDK needed for one call shape.
- **Client → Worker contract:** app does a plain `fetch(WORKER_URL, { method: 'POST', body: { sectionText, sectionType } })`; worker attaches the Gemini API key (stored as a Cloudflare Worker Secret, `wrangler secret put GEMINI_API_KEY`) and returns `{ rewrittenText }` or `{ error }`.
- **Worker abuse protection:** the Worker endpoint is public once deployed (no user auth in this app). Minimum viable protection: a fixed shared-secret header (`X-App-Secret`) the app sends and the Worker checks before calling Gemini, plus Cloudflare's built-in per-IP rate limiting (free tier includes basic rate limiting rules). This is not real auth — the secret ships inside the APK and can be extracted by anyone who decompiles it. It stops casual scraping, not a determined attacker.
- **Hard daily spend cap (non-negotiable, not deferrable):** because a leaked shared secret could otherwise generate unbounded real Gemini billing, the Worker enforces a hard daily request ceiling independent of the secret — a single counter in Cloudflare KV, incremented per Gemini call, reset daily (e.g. via key `usage:{YYYY-MM-DD}`). Once the counter hits the cap, the Worker returns `{ error: "AI unavailable today" }` without calling Gemini, regardless of who's asking. This is a global circuit breaker, not per-user — it turns "someone could run up an unbounded bill" into "worst case, one day's budget is spent," and unlike the shared secret it can't be bypassed by extracting anything from the APK. Unlike the shared-secret deterrent, this one is a real cost-control measure and ships with v1, not revisited-later.
- **Client-side AI usage gating:** decrement `AIUsage.freeCreditsRemaining` locally after each successful rewrite; block the AI button when exhausted and `subscriptionActive` is false. This is enforced client-side only (per PRD's accepted reinstall-bypass limitation) — no server-side credit ledger for v1.
- **Timeout/failure handling:** `fetch` with an explicit ~10s timeout (AbortController); on any failure (timeout, non-200, network error), fall back to the user's original text untouched and show a plain retry-or-dismiss message. Never lose typed input.

## 6. ATS Scoring & JD Matching

- **Pure JavaScript, no library, no AI call** (per PRD — this must be deterministic).
- Checklist checks are simple boolean functions over the resume data object (has-contact-info, has-standard-section-headings, section-count/length-in-range, no-empty-required-fields) — implemented as an array of `{ id, check: (resume) => boolean, message }` so adding a new check later is a one-line addition, not a refactor.
- **JD keyword matching (v1 approach, to close PRD's open question):** lowercase + tokenize both the JD text and the resume's full text, strip a small hardcoded English stopword list, take the JD's unique tokens as the "target keyword set," and score = (target keywords also present in resume) / (total target keywords). No stemming/NLP library (e.g. no `natural`, no `compromise`) — plain string ops are enough for a keyword-overlap signal; upgrade only if the naive version is measurably too noisy against real job descriptions once tested.
- Both scoring functions get one runnable self-check (`ats.test.js` style assertions or a `__DEV__`-only console self-test) — this is the one piece of real branching logic in the app, per the standing rule that non-trivial logic needs a check.

## 7. Export

- **PDF:** `expo-print`'s `printToFileAsync({ html })`, then `expo-sharing`'s `shareAsync` to let the user save/send the resulting file — both official Expo modules, no third-party PDF renderer needed.
- **Word:** `docx` (npm package) to build the `.docx` buffer in-memory from the resume data object, written to disk via `expo-file-system` and shared via `expo-sharing`, same as the PDF path.
- Both exports are local-only, no network call, no server round-trip — consistent with PRD's "costs nothing to provide" reasoning for never paywalling export.

## 8. Monetization / Billing

- **`react-native-iap`** for Google Play Billing (subscription: ₹29/month). This is the one dependency that forces the Expo Go → EAS Dev Build transition (Section 1) — it isn't available in Expo Go and needs a config plugin + native build.
- Subscription state (`subscriptionActive`) is read from Play Billing's purchase/subscription status at app launch and after any purchase-flow completion, then cached into the local `AIUsage` record so the rest of the app doesn't need to touch the billing API directly.
- No server-side receipt validation for v1 — client-side Play Billing state is trusted, consistent with the PRD's already-accepted "local-only credit tracking is bypassable" limitation. Revisit only if paid-tier abuse is actually observed.

## 9. Tooling & Environment

- **Package manager:** whatever's already initialized (npm, per the existing `package-lock.json`) — no switch to pnpm/yarn without a reason.
- **Linting/formatting:** Expo's default ESLint config (`expo lint` / `eslint-config-expo`) — no custom rule set for a solo 1hr/day project.
- **Secrets:** the Cloudflare Worker holds `GEMINI_API_KEY` and `APP_SHARED_SECRET` as Wrangler secrets (never committed). The Expo app holds only the public Worker URL and the shared-secret value as a build-time constant — acceptable since it's a low-value scraping deterrent, not a real credential (see Section 5).
- **No CI/CD pipeline for v1** — solo dev, manual `eas build` when a release is ready. Automate only once release cadence makes manual builds actually annoying.

## 10. Open Technical Questions

1. Exact CSS layout for the 1-2 chosen templates — depends on PRD's still-open "pick 1-2 open-source ATS-safe templates" (PRD Section 11.1); template HTML gets written once that's chosen.
2. Whether Cloudflare's free-tier rate limiting is configured per-IP or needs a lightweight custom counter in the Worker — decide when the Worker is actually built, not now.
3. `react-native-iap` config-plugin setup specifics — deferred until monetization is actually being built (v1's later milestone, not the first thing to implement).

← Vault companion notes: see `Vault/WIKI/AI Architecture.md`, `Export Pipeline.md`, `Data Model.md` for the product-level reasoning this document turns into implementation choices.

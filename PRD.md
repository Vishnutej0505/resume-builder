# PRD: Resume Builder (India-focused, AI-assisted) — LOCKED

## Context / Constraints

Solo build, ~1hr/day, 4-6 month runway. Android-first (Play Store). India-first market. No existing audience/distribution. Target revenue: ₹2,000-10,000/month. Wedge: existing India competitors use dark patterns (confirmed real complaint — ₹850/month, still watermarked); this app competes on honesty — free, unlimited export, no dark patterns.

## 1. Problem Statement

Job seekers in India — both first-time graduates and experienced professionals — need a professional, ATS-safe resume but face two bad options: expensive, deceptive apps (watermarks even after payment, ad-gated exports) or free tools that produce generic, poorly-worded results. Most people draft rough notes and expect AI to rewrite them professionally rather than writing polished bullets themselves. No honestly-priced, AI-assisted, India-first resume app fills this gap.

## 2. Target User + 2 Personas

**Persona 1 — Aditi, Final-Year Engineering Student.** Building her first real resume; has rough notes about projects/internships but doesn't know professional phrasing. Needs AI to turn rough notes into proper bullet points; simple ATS-safe template; very price-sensitive.

**Persona 2 — Rohit, 6 Years Experienced, Job-Switching.** Has an existing resume but dated/badly formatted. Needs to paste existing content, get AI-polished bullets, export quickly, and re-tailor for each job he applies to.

## 3. Goals and Non-Goals

**Goals (v1):**
- AI-assisted rewriting that turns rough input into professional resume language (cloud-based, Gemini 3.5 Flash-Lite).
- 1-2 genuinely good, ATS-safe (single-column, no graphics) templates.
- Deterministic ATS-health checklist scoring, with optional job-description paste for keyword-match scoring.
- Fully working offline for everything except AI rewriting and JD-matching (core value must survive no internet).
- **PDF and Word export, both completely free and unlimited for every user, forever** — this is a deliberate differentiator, not a placeholder.
- You personally generate and would submit a real resume with it before v1 is called done.

**Non-Goals (v1):**
- No persistent multi-resume/version storage — one master resume's data per user (see Section 6, tailoring is ephemeral, not versioned).
- No cover letter generator, no LinkedIn import.
- No iOS build.
- No offline/on-device LLM — evaluated and rejected for v1 (see Section 10, decision log).
- No unlimited *monthly* free AI usage — the free allowance is a one-time resume-completion credit pool, not a recurring monthly quota (see Section 6).

## 4. User Stories

- As Aditi, I want rough notes turned into a professional bullet point by AI, so I don't need to know resume-writing conventions myself.
- As Rohit, I want to paste my existing resume content and get AI-polished phrasing, so I can update my resume in minutes.
- As any user, I want to preview my resume in a clean template before exporting.
- As any user, I want to export a PDF and a Word document that both open correctly everywhere, for free, with no limit.
- As any user, I want to paste a target job description and see a health/match score, so I know if my resume is likely to pass an ATS scan for that specific job.
- As Rohit, I want to re-tailor my resume for a second, different job application, so each application is optimized for that specific role.
- As a user without internet, I want to still fill in my resume, preview it, and export it, so a bad connection doesn't block me from finishing.

## 5. Feature List

**MVP:**
1. Flexible resume data entry (sections: Summary, Education, Experience, Projects, Skills, Certifications — add/remove/reorder freely, supports both fresher and experienced shapes)
2. AI-assisted rewriting per section (rough text in → polished text out; Accept / Edit / Keep Original — never silently auto-applied)
3. ATS health checklist score (deterministic: single-column check, standard headings, contact info present, length check) + optional job-description paste for keyword-match scoring
4. 1-2 ATS-safe templates, live preview
5. PDF export (`expo-print`) and Word export (`docx` library) — both free, unlimited, always
6. Local save/edit of one master resume (AsyncStorage)
7. AI usage gating: one-time free resume-completion credit pool (~20 AI rewrites) to finish the first resume; after that, re-tailoring for a new job description requires the ₹29/month subscription (unlimited re-tailoring while subscribed)

**V2 (explicitly deferred):**
- Persistent multiple saved/tailored resume versions
- More templates
- Cover letter generator
- LinkedIn import
- iOS build
- Revisit on-device/offline AI if users genuinely request it

## 6. Detailed Functional Requirements (MVP)

**Resume data entry** — flexible section list, add/remove/reorder, supports both personas without forcing either into the wrong shape.

**AI-assisted rewriting**
- Cloud-based via **Gemini 3.5 Flash-Lite** (cheapest sufficient model for short text-rewrite tasks, ~₹0.01-0.02/rewrite — billing enabled from day one, no free-tier-quota juggling logic needed since cost is already trivial).
- Routed through a **Cloudflare Workers** proxy (free tier, 100K requests/day, no credit card required) — the API key must never live in the client app itself.
- User sees AI's rewrite alongside their original text; explicit Accept / Edit / Keep Original. Never silently overwrites.
- Degrades gracefully with no internet: AI button disabled with a clear "needs internet" message; everything else (manual entry, templates, export) works fully offline.

**ATS health scoring**
- **Deterministic/rule-based, not AI-based.** Checks: single-column layout, standard section headings present, contact info present, reasonable length, no unrendered artifacts.
- Optional: user pastes a target job description → keyword-overlap scoring against that JD.
- Marketed honestly as a "resume health checklist," never as a guaranteed ATS pass — real ATS software varies by vendor and is proprietary; no tool can promise a match to a specific company's system.

**Export**
- PDF via `expo-print` (HTML/CSS → PDF, handles reflow via CSS rather than custom layout code).
- Word via the `docx` library, built from the same underlying resume data — a second rendering pipeline that must stay visually consistent with the PDF/HTML template.
- **Both completely free, unlimited, for every user, always** — no paywall, no watermark, ever. This is the core trust/differentiation pitch against the ₹850/month competitor.

**Monetization / AI usage gating (Option A — ephemeral tailoring, locked)**
- One master resume's data is the only persisted content — no multi-version storage.
- Free: a **one-time pool of ~20 AI rewrite credits** to fully polish and complete the first resume (not a monthly quota — sized to comfortably finish one real resume so first-time users experience the full "wow" before hitting any wall).
- Once the free pool is used, **re-tailoring the resume against a new job description** (re-running AI rewrites and JD-match scoring for a different role) requires the ₹29/month subscription.
- **Tailoring is ephemeral, not persisted:** when a subscriber pastes a new job description and re-tailors, the AI-adjusted bullets/keywords apply only to that session's preview/export. They are not written back into the master resume data, and are not saved as a separate version. Tailoring for yet another job later starts fresh from the same master content. This avoids reintroducing multi-version storage while still delivering real recurring value tied to genuine recurring behavior (applying to multiple jobs over time).
- Manual editing and export always remain available regardless of AI credit balance — AI credits gate only the "AI rewrite" and "AI re-tailor" actions, never basic usage.

## 7. Data Model Sketch

```
Resume (single master record per user)
- personalInfo: { name, email, phone, location, linkedIn }
- sections: [
    { type: enum(summary|education|experience|projects|skills|certifications),
      order: int,
      items: [ { title, subtitle, dateRange, bullets: [string] } ] }
  ]
- selectedTemplate: string
- updatedAt: datetime

AIUsage (local)
- freeCreditsRemaining: int   // starts at ~20, one-time, not monthly
- freeCreditsExhausted: bool
- subscriptionActive: bool    // from Play Billing subscription state

(No persisted per-job-description tailored versions — tailoring output is session-only, per Option A.)
```

## 8. Edge Cases and Failure States

- **AI API/proxy failure or timeout** — fail gracefully back to the user's original text; never lose what they typed.
- **AI suggestion is worse or wrong** — one-tap reject, keep original; never auto-applied.
- **No internet** — AI and JD-matching disabled with a clear message; entry, templates, and export stay fully functional.
- **Free credit pool exhausted mid-resume** — clear message, offer subscription; user can still manually edit and export without AI.
- **Empty required fields at export** — warn and block; never export a blank/broken file.
- **Very long section content** — CSS reflow handles most cases; extreme overflow needs real testing with messy sample data, not just assumed to work.
- **Pasted job description is empty/garbage/too short to score meaningfully** — degrade to the generic ATS health checklist only, don't produce a fake/meaningless match score.
- **Local-only credit tracking is bypassable by reinstalling the app** — known, accepted v1 limitation. Revisit only if abuse becomes an actual observed problem.

## 9. Success Metrics

**Phase 1 (personal validation):** you generate a real resume with this app that you'd actually submit for a job — no compromises.

**Phase 2 (Play Store):**
- % of installs that complete a full resume (activation, not installs)
- AI suggestion acceptance rate (signals output quality)
- Free-to-paid conversion rate (specifically: % of users who return to re-tailor for a second job and hit the paywall)
- Monthly AI API cost vs. subscription revenue — track from week one to confirm the unit economics stay healthy (expected to be very healthy given ~₹0.01-0.02/rewrite cost vs. ₹29/month subscription).

## 10. Decision Log (for context, not re-litigating)

- **Offline/on-device LLM (Ollama-style) — rejected for v1.** Ollama doesn't run on Android; mobile-native alternatives require bundling 500MB-2GB+ models, are slow, drain battery, produce meaningfully worse output than cloud models, and perform worst on exactly the budget/low-RAM phones common in the target market. Revisit only if real user demand emerges.
- **Export paywall — rejected.** Export costs nothing to provide (pure local rendering); gating it protects no margin and recreates the exact dark pattern this app is positioned against.
- **Monthly AI quota — rejected in favor of one-time free pool + per-new-job subscription gate.** Resume-building is sporadic and mostly one-time; a monthly reset either blocks first-time users before they see value, or is generous enough that nobody ever needs to pay. Gating on "tailor for a new job" ties payment to genuine recurring behavior instead.
- **Multi-version resume storage — rejected for v1 (Option A chosen over Option B).** Ephemeral, non-persisted tailoring per job description delivers the same subscriber value without reintroducing the versioning complexity explicitly scoped out to keep v1 buildable solo in the available time.
- **Cloudflare Workers over Firebase Functions** — Cloudflare's free tier requires no credit card at all; Firebase Functions requires adding a credit card and moving to the Blaze plan even to access free-tier usage.

## 11. Open Questions

1. **Templates** — need to actually search and pick 1-2 open-source ATS-safe templates (next step, both searching in parallel).
2. **Exact free-credit pool size (~20)** — a placeholder based on rough estimate of sections × bullets; should be sanity-checked once real template/section structure is built, since actual rewrite count per resume may differ.
3. **JD-match scoring specifics** — exact keyword-matching approach (simple overlap vs. weighted by section) not yet designed; to be scoped when building that feature.

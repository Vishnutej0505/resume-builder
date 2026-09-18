# UI & UX Design Brief — LOCKED

Companion to `APP_FLOW.md` (screens/navigation already decided there — this document is what each screen looks like and why). Written before any UI code, so visual decisions aren't improvised screen-by-screen.

## 1. Design Principles (3 rules everything must obey)

1. **Feels like a résumé, not an app.** The document itself (preview, PDF, Word export) must read as a serious professional artifact — a recruiter should never sense "AI-app-generated." Chrome (nav, buttons) can have character; the resume content stays sober, single-column, print-safe, per → the ATS-safe template constraint already locked in `PRD.md`.
2. **Never hide the honest option.** Every gated action shows what's free and what isn't in the same breath — no disguised paywalls, no fake urgency, no dark patterns. This is the entire brand wedge (`PRD.md` Section 1); violating it visually anywhere undermines the pitch everywhere.
3. **Cheap to render, cheap to understand.** Budget Android phones and patchy connections are the default user, not the edge case (`PRD.md` personas) — minimal blur/heavy shadows, no custom font downloads, generous tap targets, plain language over icon-only UI.

## 2. Visual Direction

- **Mood:** calm, trustworthy, unhurried — closer to a clean government/fintech utility (think DigiLocker, a plain banking app) than a consumer growth-hacked app. The resume content itself should look like a well-typed Google Doc, not a "template."
- **References:** Notion's restraint, Linear's plainness, and — deliberately — the visual seriousness of the document itself outweighing the app's own branding.
- **Avoid explicitly:** purple/violet AI-generic gradients, glassmorphism, neon accents, confetti/celebration animations, gamification (streaks, badges, progress-bar dopamine tricks). None of that fits a tool for a job application — a graduate about to submit their first resume isn't looking for delight, they're looking for confidence that this won't embarrass them.
- One confident accent color carries all CTAs; everything else is neutral, so the resume document (the actual value) visually dominates the app chrome around it.

## 3. Design Tokens

**Color palette** (light mode only for v1 — a resume is a white-background printed document by convention, and dark mode is real extra work for zero v1 value; revisit only if requested):

| Token | Hex | Usage |
|---|---|---|
| `accent` | `#2563EB` | Primary buttons, links, active nav state |
| `success` | `#16A34A` | Accept/checkmarks, ATS checklist pass |
| `warning` | `#D97706` | Paywall/credit-low notices — used sparingly, informational tone not alarm |
| `error` | `#DC2626` | Failed AI call, blocked export, validation errors |
| `bg` | `#FFFFFF` | App and document background |
| `surface` | `#F8FAFC` | Cards, section containers |
| `border` | `#E2E8F0` | Dividers, input borders |
| `text-primary` | `#0F172A` | Body text, headings |
| `text-secondary` | `#475569` | Helper text, timestamps, subtitles |

`text-secondary` is deliberately a darker slate than a typical "muted gray" (e.g. not `#94A3B8`) — a lighter gray reads fine on a designer's monitor but fails contrast on budget phone screens in bright daylight, which is the real usage condition for this audience. Verify final hex pairs against a WCAG contrast checker at implementation time rather than trusting this estimate.

**Type scale:** system font only (Roboto on Android via RN default) — no bundled custom font. Costs nothing, loads instantly, and avoids the asset-weight/rendering-cost concern from Section 1's third principle.
```
caption   12  (helper text, timestamps)
body      14  (default UI text)
bodyLg    16  (resume content preview, primary inputs)
h3        20  (section headers)
h2        24  (screen titles)
h1        32  (empty-state headline only)
```

**Spacing scale (4px base):** `4, 8, 12, 16, 24, 32, 48` — every margin/padding in the app picks from this list, never an arbitrary number.

**Radius:** `8px` default (cards, buttons, inputs), `4px` for small elements (chips/tags), `999px` for pills (credit-count badge).

**Shadows/elevation:** native RN `elevation` (Android) at level 1-2 for cards, no custom blurred-shadow libraries — cheap to render, per Section 1.

## 4. Screen Inventory (purpose, one line each)

Full navigation detail already in `APP_FLOW.md` — restated here only for design context:

| Screen | Purpose |
|---|---|
| Home (Editor) | Primary workspace — personal info + sections + AI rewrite |
| ATS Check | Confidence-building — "will this pass a scan" |
| Preview | The payoff moment — see the actual document before export |
| Paywall | Honest upsell — must not feel like a trap |
| Settings | Quiet utility screen, rarely visited |

## 5. Core User Flows (UI framing)

Logic already locked in `APP_FLOW.md` — here's what's visually on screen at each step of the two flows that matter most:

**First resume (Aditi persona):** empty Home with placeholder guidance → fills personal info → adds a section → types rough notes → taps AI Rewrite → sees Original/Suggested side-by-side card → Accepts → repeats per bullet → taps Preview footer nav → sees rendered document → taps Export → picks PDF → native share sheet.

**Re-tailoring (Rohit persona):** existing filled Home → taps ATS Check → pastes a JD → taps Check Match → (if free pool exhausted) sees Paywall with the specific reason "Re-tailoring for a new job needs a subscription," not a generic upsell → subscribes → returns to ATS Check with match score now visible.

## 6. Per-Screen Layout

**Home:** header (app name + gear icon, fixed) → scrollable body: personal info card (top, always visible first) → section list (draggable cards, each with items/bullets nested) → floating "+ Add Section" as a bottom-anchored button, not buried in the scroll. Primary action: AI Rewrite (inline per bullet, not a single dominant CTA — there are many small decisions per screen, not one big one). Footer nav bar fixed at bottom.

**ATS Check:** top: checklist card (always visible, no scroll needed for it — it's short and it's the trust-building payoff, shouldn't require scrolling to see). Below: JD paste textarea + "Check Match" button. Results (when present) appear directly below the button, not in a modal — keeps the JD text visible alongside its own score.

**Preview:** near-fullscreen WebView (the document is the content, minimal chrome around it) → template switcher as a small segmented control above the WebView, not overlapping it → "Export" as a single fixed bottom button, the clear primary action on this screen (unlike Home, this screen has exactly one job).

**Paywall:** centered, no footer nav (deliberately away from the main flow) → reason text (specific, not generic) → price stated plainly (₹29/month, no hidden fine print) → "Subscribe" as the one prominent button → "Restore Purchases" and "Not now" as lower-weight text links, not competing buttons.

**Settings:** simple list rows (Subscription status, Restore Purchases, Manage Subscription, version) — no cards, no visual weight; this screen should feel administrative, not designed-for.

## 7. Component Library

| Component | Variants | States |
|---|---|---|
| `Button` | primary, secondary, text-link | default, pressed, disabled, loading (spinner replaces label, no layout shift) |
| `TextInput` | single-line, multiline (bullets/JD paste) | default, focused, error (red border + inline message below, never a toast for field-level errors) |
| `SectionCard` | one per section type | default, dragging (elevated, per Section 3 elevation tokens) |
| `AIComparisonCard` | inline, appears under a bullet | loading, success (shows Accept/Edit/Keep), error |
| `Chip`/`Badge` | credit counter ("14 credits left"), subscription status | — |
| `ChecklistRow` | pass, fail | icon + text always paired — never color-only (Section 10) |
| `ActionSheet` | export choice (PDF/Word) | — |
| `EmptyState` | Home (no sections yet) | illustration-free — a short line of text + the relevant action button, not a decorative graphic (cheap to render, per Section 1) |

## 8. States (per key screen)

- **Home:** empty (first launch) / normal (editing) / AI-loading (spinner on one bullet, rest of screen fully interactive) / AI-error (inline, non-blocking) / offline (AI Rewrite buttons visibly disabled with a static "needs internet" label, not hidden — hiding it would look broken, per PRD Section 6).
- **ATS Check:** unscored (checklist only) / scored (checklist + match results) / blocked (redirects to Paywall, no partial-state UI needed here).
- **Preview:** loading (WebView rendering — brief, show a plain spinner) / ready / export-in-progress (button shows loading state, per `Button` component) / export-blocked (inline warning naming the missing field, e.g. "Add your email to export").
- **Paywall:** default / purchase-in-progress (button loading state) / restore-success / restore-empty ("No active subscription found").
- **Settings:** loading (subscription status being fetched at launch) / loaded.

## 9. Responsive Behavior

Android phone-first only, per PRD (no iOS, no tablet goal stated). Layouts use flex-based RN styles (percentage/flex widths, not fixed pixel widths) so the app doesn't break on the actual range of Android phone widths in market (~360-430dp) or on a tablet/foldable someone happens to open it on — but no dedicated tablet layout is designed or tested for v1. This is a "don't crash," not a "look great," commitment for anything outside phone width, matching the PRD's explicit scope.

## 10. Accessibility

- **Contrast:** all text/background pairs in Section 3 target WCAG AA (4.5:1 body text, 3:1 large text) — verify with an actual contrast checker at implementation, the hex values above are a considered starting point, not a verified guarantee.
- **Touch targets:** minimum 44×44dp on every tappable element, including icon-only buttons (delete, drag handle, AI-rewrite sparkle icon) — mis-taps on small icons are a real risk on budget phones with imprecise touchscreens, and this is a form the user needs to complete correctly for a real job application, not a casual app.
- **Screen reader (TalkBack):** every icon-only button gets an explicit `accessibilityLabel`; the Accept/Edit/Keep-Original trio on the AI comparison card need labels that distinguish them clearly out of visual context (e.g. "Accept AI suggestion," not just "Accept").
- **Never color-only:** the ATS checklist's pass/fail state is icon + text together, never a color alone (Section 7's `ChecklistRow`) — this is a real-stakes accessibility case, not decorative, since a colorblind user needs to actually read and act on this checklist to finish a real job application.
- **Focus order:** natural top-to-bottom, left-to-right on all form screens — no custom focus traps or reordering.

← See also: `APP_FLOW.md` (navigation logic this brief skins), `TRD.md` (why no custom fonts/heavy libraries), `Vault/WIKI/Design System.md` (quick-reference version).

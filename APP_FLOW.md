# App Flow — Navigation & User Journey — LOCKED

Companion to `TRD.md` (Section 2, which already ruled out a router library) and `ARCHITECTURE.md`. This document is the screen-by-screen, button-by-button map — every tap and exactly what happens next — so the UI can be built without re-deciding flow mid-code.

## 1. Screen Inventory

Five screens total, held as one state value (`useState<'home' | 'ats' | 'preview' | 'paywall' | 'settings'>`) at the app root — no navigation library, per TRD Section 2.

| Screen | Reached from | Purpose |
|---|---|---|
| **Home** (Editor) | App launch (always the landing screen) | Personal info + section/bullet editing, AI rewrite per bullet |
| **ATS Check** | Home / Preview footer nav | Deterministic checklist + optional JD paste & match score |
| **Preview** | Home / ATS Check footer nav | Rendered template (WebView) + Export |
| **Paywall** | Home (AI Rewrite blocked) or ATS Check (Check Match blocked) | Subscribe / Restore purchases |
| **Settings** | Home header icon | Subscription status, restore purchases, manage subscription |

Plus two **native OS surfaces** that aren't app screens and aren't part of this state machine: the **system share sheet** (export) and the **Play Billing purchase sheet** (subscribe) — control leaves the app briefly, then returns to wherever it was triggered from.

**No onboarding wizard.** Ladder rung 1: a first-time user doesn't need a marketing tour before they can type their name — Home handles the empty state directly (placeholder text guiding them to fill personal info and add a section), which is fewer screens to build and nothing lost.

## 2. Navigation State Machine

```
        ┌────────────────────────────────────────┐
        │                                          │
   ┌────▼────┐   footer nav   ┌───────────┐  footer nav  ┌──────────┐
   │  Home   │◄──────────────►│ ATS Check │◄────────────►│ Preview  │
   └────┬────┘                └─────┬─────┘               └────┬─────┘
        │ AI Rewrite blocked        │ Check Match blocked       │
        │ gear icon                 │                           │
        ▼                           ▼                           │
   ┌─────────┐               ┌───────────┐                      │
   │ Settings│               │  Paywall  │◄─────────────────────┘
   └────┬────┘               └─────┬─────┘        (not reachable
        │ back                     │ subscribe/restore success   from Preview in v1 —
        ▼                          │ → returns to origin screen  Preview export isn't
      Home                         ▼                             gated, see Section 5)
                                  Home / ATS Check
```

Android hardware back button: from ATS Check, Preview, Paywall, or Settings → **Home**. From Home → default OS behavior (exit/backgrounds the app). No custom exit-confirmation dialog — not worth building for v1.

## 3. Home Screen (Editor) — Button Map

- **Header gear icon** → navigate to **Settings**.
- **Personal info fields** (name, email, phone, location, LinkedIn) — inline editable, autosave on blur (debounced write to AsyncStorage per TRD Section 4). No navigation.
- **"+ Add Section" button** → shows a picker limited to section types not yet added → on pick, appends an empty `ResumeSection`, stays on **Home**, scrolls to the new section.
- **Section delete icon** → confirm dialog → on confirm, removes the section and re-sequences remaining `order` values (per ARCHITECTURE Section 2.2). Stays on **Home**.
- **Section drag handle** → reorder, re-sequences `order` on drop. Stays on **Home**.
- **"+ Add Item" (within a section)** → appends an empty `SectionItem`, expands it for editing. Stays on **Home**.
- **"✨ AI Rewrite" (next to a bullet)**:
  1. Check gate: `subscriptionActive || freeCreditsRemaining > 0`.
     - **Blocked** → navigate to **Paywall** (origin = Home).
     - **Allowed** → inline spinner on that bullet → `POST /rewrite`.
  2. On success → inline comparison card appears under the bullet (Original vs Suggested) with three buttons:
     - **Accept** → replaces the bullet text, decrements `freeCreditsRemaining` if not subscribed, dismisses the card. Stays on **Home**.
     - **Edit** → loads the suggested text into the editable field for the user to adjust before it's saved as their own edit; dismisses the card. Stays on **Home**.
     - **Keep Original** → dismisses the card, no change. Stays on **Home**.
  3. On failure/timeout → inline error text ("Couldn't get a suggestion — try again"), original text untouched. Stays on **Home**.
- **Footer nav** (persistent on Home/ATS Check/Preview) → **ATS Check** or **Preview**.

## 4. ATS Check Screen — Button Map

- Checklist rows (contact info present, standard headings, length OK, etc.) are computed live from the current Resume on every render — no "run check" button, there's nothing to trigger.
- **"Paste Job Description" text box + "Check Match" button**:
  - Gate (see Section 5 for the reasoning): `subscriptionActive || freeCreditsRemaining > 0`.
    - **Blocked** → navigate to **Paywall** (origin = ATS Check).
    - **Allowed** → score computed instantly, locally, no network call (per TRD Section 6 — this is plain JS, not an AI call) → results (match %, matched/missing keywords) shown inline on the same screen. No navigation, no credit decremented (matching stays free while inside the gate; scoring itself has no marginal cost).
  - Empty/garbage/too-short JD text → skip scoring, show the generic checklist only (per PRD Section 8 edge case) — no error state, just a quieter result.
- **Footer nav** → **Home** or **Preview**.

## 5. Clarifying a PRD gap: what exactly gates JD-match scoring

PRD Section 6 ties "JD-match scoring for a different role" to the subscription as part of "re-tailoring," but doesn't spell out the mechanism. Locked interpretation, consistent with the rest of Section 6's free-pool logic: **JD-match scoring uses the same gate as AI rewrite** (`subscriptionActive || freeCreditsRemaining > 0`) rather than its own separate counter. It doesn't consume a credit itself (it's free to compute), but once the free pool that got the user through their *first* resume is used up, pasting a JD for a *new* role is blocked the same way AI rewrite is — which is exactly the "re-tailor for a second job requires subscription" behavior the PRD describes, without needing a second, separate tracking field. If this reading doesn't match your intent, it's a one-line gate change, not a data-model change.

## 6. Preview Screen — Button Map

- **Template switcher** (segmented control, if 2 templates exist) → updates `selectedTemplate`, WebView re-renders with the new template. Stays on **Preview**. Not gated — template choice isn't an AI feature.
- **"Export" button** → opens a small action-sheet modal (not a new screen) with two options:
  - **Export as PDF** / **Export as Word**:
    1. Validate `personalInfo.name` and `personalInfo.email` are present → if missing, inline warning, block, stay on **Preview** (per PRD Section 8).
    2. If valid → render file (`expo-print` or `docx`, per ARCHITECTURE Section 4) → **system share sheet** opens (native, outside app navigation) → user saves/sends → control returns to **Preview**.
  - Export is **never gated** by credits or subscription (per PRD's core differentiator — export is always free).
- **Footer nav** → **Home** or **ATS Check**.

## 7. Paywall Screen — Button Map

- Copy varies by trigger reason (shown, not separately routed): "You've used your 20 free AI credits" (from Home) vs. "Re-tailoring for a new job needs a subscription" (from ATS Check) — same screen, a passed-in reason string.
- **"Subscribe" button** → `react-native-iap.requestSubscription(...)` → native **Play Billing sheet** (outside app navigation) → on success, `subscriptionActive = true` is saved (per ARCHITECTURE Section 4.4) → **auto-navigates back to the origin screen** (Home or ATS Check) with the gate now open.
- **"Restore Purchases" button** → `getAvailablePurchases()` → active subscription found → same success path as above; none found → inline message "No active subscription found," stays on **Paywall**.
- **"Not now" / back** → returns to the origin screen; the gate remains closed, nothing changes.

## 8. Settings Screen — Button Map

- Shows subscription status ("Active" or "Free tier: N credits remaining") and app version — read-only, no computation.
- **"Restore Purchases"** → same behavior as Section 7.
- **"Manage Subscription"** → deep-links out to the Play Store's subscription management page (native, outside the app). No return-flow handling needed beyond the OS's own back behavior.
- **Back** → **Home**.

## 9. Open Items

- Section 5's JD-match gating is a clarification made here, not explicitly in the original PRD — flagged above, revisit if it doesn't match intent.
- Exact copy/wording for empty states, paywall messaging, and error toasts isn't written yet — a UX-copy pass, not a flow decision, done when screens are actually built.

← See also: `TRD.md` Section 2 (why no router), `ARCHITECTURE.md` Section 5 (the same flows from the data/API side), `Vault/WIKI/Navigation Model.md` (quick-reference version).

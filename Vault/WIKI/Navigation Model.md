# Navigation Model

Full button-by-button map in `APP_FLOW.md` (project root) — this note is the shape to remember while coding.

- **5 screens, one state value, no router:** Home (Editor), ATS Check, Preview, Paywall, Settings. See → [[Tech Stack]] for why no navigation library.
- **No onboarding wizard.** Home handles the first-launch empty state directly with placeholder guidance — fewer screens, nothing lost.
- **Footer nav** links Home ↔ ATS Check ↔ Preview freely (unrelated to gating). Paywall and Settings are reached only from specific triggers, not the footer nav.
- **Two native OS surfaces sit outside the state machine:** the system share sheet (export) and the Play Billing purchase sheet (subscribe) — control leaves the app and returns to whichever screen triggered it.
- **AI Rewrite and JD-match "Check Match" share one gate:** `subscriptionActive || freeCreditsRemaining > 0`. This was a PRD gap (Section 6 mentioned JD-match gating without specifying the mechanism) — resolved by reusing the same gate rather than adding a second tracking field. See → [[Things To Avoid]] pattern of preferring one mechanism over two.
- **Export is never gated**, on any screen, by design — see → [[Export Pipeline]].

← back to [[Resume Builder MOC]]

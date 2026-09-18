# Monetization Model

**Free:** a one-time pool of ~20 AI rewrite credits to fully polish and complete the *first* resume — not a monthly quota. Sized to comfortably finish one real resume so first-time users experience the full result before hitting any wall. → [[Export Pipeline]] is unlimited and free regardless of credits.

**Subscription (₹29/month):** unlocks unlimited re-tailoring against new job descriptions — re-running AI rewrites and → [[ATS Scoring Design]] JD-matching each time the user applies to a different role.

**Why gated this way, not a monthly quota:** resume-building is sporadic and mostly one-time. A monthly reset either blocks first-time users before they see any value, or is generous enough that a one-and-done user never needs to pay. Gating on "tailor for a new job" ties payment to genuine recurring behavior — see → [[Persona - Rohit]].

**Option A — ephemeral tailoring (locked over Option B):** re-tailored output for a new job description is generated fresh each time and shown only in that session's preview/export. It is never saved as a separate resume version, and never written back into the master → [[Data Model]]. This delivers the same subscriber value as full versioning would, without reintroducing the multi-resume storage complexity that was deliberately scoped out to keep v1 buildable solo.

Unit economics: ~₹0.01-0.02 API cost per rewrite (→ [[AI Architecture]]) vs. ₹29/month subscription — healthy margin even for a heavy user.

← back to [[Resume Builder MOC]]

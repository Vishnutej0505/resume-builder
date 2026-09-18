# ATS Scoring Design

Deterministic/rule-based, **not** AI-based — same "don't overclaim accuracy" principle as LexLint.

Checks:
- Single-column layout (no tables/graphics that break ATS parsing)
- Standard section headings present
- Contact info present
- Reasonable length
- No unrendered artifacts

Optional: user pastes a target job description → keyword-overlap scoring against that specific JD. Exact matching approach (simple overlap vs. weighted by section) still undecided — see → [[Open questions]].

Marketed honestly as a "resume health checklist," never as a guaranteed ATS pass — real ATS software varies by vendor and is proprietary; no tool can promise a match to a specific company's system.

This feature is the actual reason → [[Persona - Rohit]]'s repeat usage (re-tailoring per job) has real value, which is what → [[Monetization Model]] is built around.

← back to [[Resume Builder MOC]]

# Design System

Full brief in `DESIGN_BRIEF.md` (project root) — this note is the shape to remember while coding.

- **3 rules everything obeys:** feels like a résumé not an app; never hide the honest option; cheap to render, cheap to understand (budget Android phones are the default user, not the edge case).
- **Mood:** calm/trustworthy (DigiLocker/Linear territory), not a flashy consumer app. Explicitly avoid purple-gradient AI-generic look, gamification, confetti — none of it fits a job-application tool.
- **Light mode only for v1** — a resume is a printed white-background document by convention; dark mode is real work for zero v1 value.
- **System font only**, no custom font bundle — see → [[Tech Stack]]'s "cheap to render" principle.
- **Color tokens, spacing scale, type scale** are all fixed lists in `DESIGN_BRIEF.md` Section 3 — never pick an arbitrary value outside them.
- **Never color-only for meaning** — the ATS checklist's pass/fail is icon + text always, a real accessibility requirement given the stakes (a real job application), not decoration.
- **Templates ("Classic" and "Modern") are typography/color choices only, never layout choices.** Both delegate to one shared section-builder (`src/lib/templates/shared.ts`) since PRD Section 6 requires every template to stay single-column/standard-headings — the "1-2 templates" question was never about visual variety at the layout level, since layout variety is exactly what makes a resume ATS-unsafe.

← back to [[Resume Builder MOC]]

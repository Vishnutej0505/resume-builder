# Export Pipeline

Two rendering paths from the same → [[Data Model]], both **completely free and unlimited for every user, forever**:

- **PDF** — via `expo-print` (HTML/CSS → PDF). Reflow is handled by CSS rather than custom layout code, which also solves the "long content overflows the template" problem for free.
- **Word (.docx)** — via the `docx` library, built independently from the same resume data. A second pipeline that must stay visually consistent with the PDF/HTML template — real added work, not free to build, just free to run.

**Why export is never paywalled:** export costs nothing to provide (pure local rendering, no API calls) — gating it would protect zero margin while recreating the exact dark pattern (watermarks, export limits) this app is positioned against. See → [[Competitive Research Findings]].

← back to [[Resume Builder MOC]]

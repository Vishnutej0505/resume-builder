# Screens & States Reference

Full wireframes and mockups live in a published design canvas artifact (not a repo file — Obsidian can't embed it, so this note is just the pointer and the summary): https://claude.ai/artifact/TKt3K4QebNb1fdEiR9cvBT

Three sections on that canvas, approved as the visual reference for implementation:

1. **End-to-End Flow** — visual version of → [[Navigation Model]].
2. **Low-Fidelity Wireframes** — grayscale layout-only pass, all 5 screens.
3. **High-Fidelity Mockups** — built on → [[Design System]] tokens, Material-inspired (FAB, pill bottom-nav, elevation) since Android is the target platform. Covers these states explicitly, so they don't get missed during implementation:
   - Home: default, empty (first launch), AI-loading, AI-error
   - ATS Check: scored (match % + keyword chips)
   - Preview: ready (rendered document)
   - Paywall: default, reason-specific copy

When building each screen for real, match these mockups for layout/spacing/copy tone rather than re-deriving them — they're the approved reference, not a first draft to redesign.

← back to [[Resume Builder MOC]]

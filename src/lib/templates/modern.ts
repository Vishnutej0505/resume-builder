import type { Resume } from '../../types/resume.ts';
import { buildResumeBodyHtml } from './shared.ts';

// Same single-column, standard-headings structure as classic.ts (via
// buildResumeBodyHtml) — only typography and color differ. Sans-serif,
// accent-colored headings for a cleaner look, still built from universally
// available fonts (Helvetica/Arial), never a custom font file — nothing
// here risks the ATS-safety the layout itself already guarantees.
export function renderModernTemplate(resume: Resume): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: Helvetica, Arial, sans-serif; color: #1a1a1a; margin: 0; padding: 32px; }
  .name { font-size: 22px; font-weight: 700; color: #1e3a8a; margin-bottom: 2px; }
  .contact { font-size: 11px; color: #555; margin-bottom: 6px; }
  .section { margin-bottom: 14px; }
  .section-heading { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: #1e3a8a; padding-bottom: 3px; margin-bottom: 8px; border-bottom: 2px solid #1e3a8a; }
  .item { margin-bottom: 10px; }
  .item-title { font-size: 12px; font-weight: 700; color: #1a1a1a; }
  .item-date { font-size: 10px; color: #777; margin-bottom: 3px; }
  .bullet { font-size: 11px; color: #333; line-height: 1.6; }
</style>
</head>
<body>
  ${buildResumeBodyHtml(resume)}
</body>
</html>`;
}

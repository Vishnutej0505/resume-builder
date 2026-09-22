import type { Resume } from '../../types/resume.ts';
import { buildResumeBodyHtml } from './shared.ts';

// Single source of truth for both the live WebView preview and the PDF
// export (TRD.md Section 3) — one HTML string, so the two can't drift.
// Traditional serif look, closest to a "classic" printed resume — the safer
// of the two default choices for older/more conservative hiring pipelines.
export function renderClassicTemplate(resume: Resume): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: Georgia, 'Times New Roman', serif; color: #111; margin: 0; padding: 32px; }
  .name { font-size: 20px; font-weight: 700; margin-bottom: 2px; }
  .contact { font-size: 11px; color: #444; margin-bottom: 16px; }
  .section { margin-bottom: 14px; }
  .section-heading { font-size: 12px; font-weight: 700; letter-spacing: 0.06em; border-bottom: 1px solid #999; padding-bottom: 2px; margin-bottom: 6px; }
  .item { margin-bottom: 8px; }
  .item-title { font-size: 12px; font-weight: 700; }
  .item-date { font-size: 10px; color: #666; margin-bottom: 2px; }
  .bullet { font-size: 11px; color: #222; line-height: 1.5; }
</style>
</head>
<body>
  ${buildResumeBodyHtml(resume)}
</body>
</html>`;
}

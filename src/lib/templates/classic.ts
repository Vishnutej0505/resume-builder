import type { Resume } from '../../types/resume.ts';
import { SECTION_LABELS } from '../../theme/tokens.ts';

// Single source of truth for both the live WebView preview and the PDF
// export (TRD.md Section 3) — one HTML string, so the two can't drift.
// Only one template exists so far: PRD.md Section 11's open question on
// which 1-2 ATS-safe templates to use is still unresolved, so a second
// template/switcher isn't built yet — it would be guessing at an
// undecided choice.
export function renderClassicTemplate(resume: Resume): string {
  const { personalInfo, sections } = resume;
  const contactLine = [personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.linkedIn]
    .filter(Boolean)
    .join(' &middot; ');

  const sectionsHtml = sections
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((section) => {
      const itemsHtml = section.items
        .map((item) => {
          const titleLine =
            section.type === 'skills'
              ? ''
              : `<div class="item-title">${escapeHtml(item.title)}</div>` +
                (item.dateRange ? `<div class="item-date">${escapeHtml(item.dateRange)}</div>` : '');
          const bulletsHtml = item.bullets
            .filter((b) => b.trim())
            .map((b) => `<div class="bullet">&bull; ${escapeHtml(b)}</div>`)
            .join('');
          return `<div class="item">${titleLine}${bulletsHtml}</div>`;
        })
        .join('');
      return `<div class="section"><div class="section-heading">${(SECTION_LABELS[section.type] ?? section.type).toUpperCase()}</div>${itemsHtml}</div>`;
    })
    .join('');

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
  <div class="name">${escapeHtml(personalInfo.name || 'Your Name')}</div>
  <div class="contact">${contactLine}</div>
  ${sectionsHtml}
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

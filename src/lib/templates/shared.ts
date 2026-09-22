import type { Resume } from '../../types/resume.ts';
import { SECTION_LABELS } from '../../theme/tokens.ts';

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Shared between every template on purpose: both must stay single-column,
// standard-headings, no-tables ATS-safe layouts (PRD.md Section 6) — the
// only thing a "template" is allowed to vary here is typography/color via
// each template's own <style>, not the underlying structure or class names.
export function buildResumeBodyHtml(resume: Resume): string {
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

  return `<div class="name">${escapeHtml(personalInfo.name || 'Your Name')}</div>
  <div class="contact">${contactLine}</div>
  ${sectionsHtml}`;
}

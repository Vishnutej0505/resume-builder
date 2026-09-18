// No framework — assert-based self-check for the template's escaping and
// section-type branching (skills omits the title/date line, others don't).
import assert from 'node:assert';
import { createEmptyResume } from '../resumeModel.ts';
import { renderClassicTemplate } from './classic.ts';

let resume = createEmptyResume();
resume = {
  ...resume,
  personalInfo: { ...resume.personalInfo, name: '<script>alert(1)</script>', email: 'a@x.com' },
  sections: [
    { type: 'experience', order: 0, items: [{ title: 'Intern', subtitle: null, dateRange: '2025', bullets: ['Did X'] }] },
    { type: 'skills', order: 1, items: [{ title: '', subtitle: null, dateRange: '', bullets: ['React, Node'] }] },
  ],
};

const html = renderClassicTemplate(resume);

// User-typed HTML is escaped, never injected raw
assert.ok(!html.includes('<script>alert(1)</script>'));
assert.ok(html.includes('&lt;script&gt;'));

// Experience shows a title/date line, skills doesn't
assert.ok(html.includes('Intern'));
assert.ok(html.includes('2025'));
assert.ok(html.includes('React, Node'));

console.log('All classic template self-checks passed.');

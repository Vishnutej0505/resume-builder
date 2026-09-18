// No framework — assert-based self-check for the checklist and JD matcher.
// Run: node --experimental-strip-types src/lib/ats.test.ts
import assert from 'node:assert';
import { createEmptyResume } from './resumeModel.ts';
import { matchJobDescription, runChecklist } from './ats.ts';

// Empty resume fails all three checks
let resume = createEmptyResume();
let results = runChecklist(resume);
assert.strictEqual(results.length, 3);
assert.ok(results.every((r) => !r.passed));

// Filled resume passes all three
resume = {
  ...resume,
  personalInfo: { ...resume.personalInfo, name: 'Aditi Sharma', email: 'a@x.com' },
  sections: [
    {
      type: 'experience',
      order: 0,
      items: [
        { title: 'Intern', subtitle: null, dateRange: '2025', bullets: ['Did a thing', 'Did another thing'] },
      ],
    },
  ],
};
results = runChecklist(resume);
assert.ok(results.every((r) => r.passed));

// JD too short -> null, not a fake score
assert.strictEqual(matchJobDescription(resume, 'short'), null);

// Real JD -> matched/missing split correctly, no stemming needed for exact tokens
resume = {
  ...resume,
  sections: [
    {
      type: 'skills',
      order: 0,
      items: [{ title: '', subtitle: null, dateRange: '', bullets: ['React, JavaScript, performance tuning'] }],
    },
  ],
};
const match = matchJobDescription(
  resume,
  'We need a Frontend Engineer with React and JavaScript. UI/UX sensibility is a plus.'
);
assert.ok(match);
assert.ok(match!.matched.includes('react'));
assert.ok(match!.matched.includes('javascript'));
assert.ok(match!.missing.includes('ui/ux') || match!.missing.some((m) => m.includes('ui')));
assert.ok(match!.matchPercent > 0 && match!.matchPercent <= 100);

console.log('All ats self-checks passed.');

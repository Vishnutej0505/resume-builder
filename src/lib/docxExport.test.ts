// No framework — self-check that the docx builder produces valid, non-empty
// output and doesn't throw on a realistic resume shape.
import assert from 'node:assert';
import { createEmptyResume } from './resumeModel.ts';
import { buildResumeDocxBase64 } from './docxExport.ts';

const resume = {
  ...createEmptyResume(),
  personalInfo: { name: 'Aditi Sharma', email: 'a@x.com', phone: '', location: '', linkedIn: null },
  sections: [
    {
      type: 'experience' as const,
      order: 0,
      items: [{ title: 'Intern', subtitle: null, dateRange: '2025', bullets: ['Did a thing'] }],
    },
    {
      type: 'skills' as const,
      order: 1,
      items: [{ title: '', subtitle: null, dateRange: '', bullets: ['React, Node'] }],
    },
  ],
};

const base64 = await buildResumeDocxBase64(resume);
assert.ok(typeof base64 === 'string' && base64.length > 100, 'expected a substantial base64 string');
// A .docx is a zip archive — its base64 should decode to bytes starting with the ZIP magic number (PK).
const decoded = Buffer.from(base64.slice(0, 8), 'base64');
assert.strictEqual(decoded[0], 0x50); // 'P'
assert.strictEqual(decoded[1], 0x4b); // 'K'

console.log('All docxExport self-checks passed.');

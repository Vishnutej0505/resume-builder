// No framework — smoke check that both templates wrap the shared body in
// their own distinct, valid HTML/CSS (the detailed escaping/branching logic
// is tested once, in shared.test.ts, since both templates delegate to it).
import assert from 'node:assert';
import { createEmptyResume } from '../resumeModel.ts';
import { renderClassicTemplate } from './classic.ts';
import { renderModernTemplate } from './modern.ts';

const resume = {
  ...createEmptyResume(),
  personalInfo: { ...createEmptyResume().personalInfo, name: 'Aditi Sharma', email: 'a@x.com' },
};

const classicHtml = renderClassicTemplate(resume);
const modernHtml = renderModernTemplate(resume);

assert.ok(classicHtml.includes('Aditi Sharma'));
assert.ok(modernHtml.includes('Aditi Sharma'));

// Each template's CSS is genuinely distinct, not just a copy with a new name
assert.ok(classicHtml.includes('Georgia'));
assert.ok(modernHtml.includes('Helvetica'));
assert.ok(!classicHtml.includes('Helvetica'));
assert.ok(!modernHtml.includes('Georgia'));

console.log('All templates.test self-checks passed.');

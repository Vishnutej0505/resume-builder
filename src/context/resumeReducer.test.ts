// No framework — assert-based self-check for the reducer's branches.
// Run: node --experimental-strip-types src/context/resumeReducer.test.ts
import assert from 'node:assert';
import { createEmptyResume } from '../lib/resumeModel.ts';
import { resumeReducer } from './resumeReducer.ts';

let resume = createEmptyResume();

// ADD_SECTION appends with correct order, and refuses a duplicate type
resume = resumeReducer(resume, { type: 'ADD_SECTION', sectionType: 'experience' });
resume = resumeReducer(resume, { type: 'ADD_SECTION', sectionType: 'skills' });
resume = resumeReducer(resume, { type: 'ADD_SECTION', sectionType: 'experience' }); // duplicate, ignored
assert.strictEqual(resume.sections.length, 2);
assert.deepStrictEqual(
  resume.sections.map((s) => [s.type, s.order]),
  [
    ['experience', 0],
    ['skills', 1],
  ]
);

// UPDATE_PERSONAL_INFO patches without clobbering other fields
resume = resumeReducer(resume, { type: 'UPDATE_PERSONAL_INFO', patch: { name: 'Aditi Sharma' } });
resume = resumeReducer(resume, { type: 'UPDATE_PERSONAL_INFO', patch: { email: 'a@x.com' } });
assert.strictEqual(resume.personalInfo.name, 'Aditi Sharma');
assert.strictEqual(resume.personalInfo.email, 'a@x.com');

// UPDATE_BULLET only touches the targeted bullet
resume = resumeReducer(resume, { type: 'ADD_BULLET', sectionType: 'experience', itemIndex: 0 });
resume = resumeReducer(resume, {
  type: 'UPDATE_BULLET',
  sectionType: 'experience',
  itemIndex: 0,
  bulletIndex: 1,
  text: 'Shipped feature X',
});
const expSection = resume.sections.find((s) => s.type === 'experience')!;
assert.strictEqual(expSection.items[0].bullets[0], ''); // untouched
assert.strictEqual(expSection.items[0].bullets[1], 'Shipped feature X');

// REORDER_SECTIONS moves and re-sequences order (0..n-1)
resume = resumeReducer(resume, { type: 'REORDER_SECTIONS', fromIndex: 0, toIndex: 1 });
assert.deepStrictEqual(
  resume.sections.map((s) => s.type),
  ['skills', 'experience']
);
assert.deepStrictEqual(
  resume.sections.map((s) => s.order),
  [0, 1]
);

// REMOVE_SECTION re-sequences remaining order, never leaves a gap
resume = resumeReducer(resume, { type: 'REMOVE_SECTION', sectionType: 'skills' });
assert.strictEqual(resume.sections.length, 1);
assert.strictEqual(resume.sections[0].order, 0);

// REMOVE_ITEM / REMOVE_BULLET never leave bullets/items as null
resume = resumeReducer(resume, { type: 'REMOVE_BULLET', sectionType: 'experience', itemIndex: 0, bulletIndex: 0 });
assert.ok(Array.isArray(resume.sections[0].items[0].bullets));

console.log('All resumeReducer self-checks passed.');

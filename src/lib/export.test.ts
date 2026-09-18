// No framework — assert-based self-check for the export validation branches.
// Imports the pure function from resumeModel.ts directly, not export.ts,
// since export.ts pulls in expo-print/expo-sharing (native, not importable
// under plain Node).
import assert from 'node:assert';
import { createEmptyResume, validateForExport } from './resumeModel.ts';

let resume = createEmptyResume();
assert.deepStrictEqual(validateForExport(resume), { ok: false, missingField: 'name' });

resume = { ...resume, personalInfo: { ...resume.personalInfo, name: 'Aditi' } };
assert.deepStrictEqual(validateForExport(resume), { ok: false, missingField: 'email' });

resume = { ...resume, personalInfo: { ...resume.personalInfo, email: 'a@x.com' } };
assert.deepStrictEqual(validateForExport(resume), { ok: true });

console.log('All export validation self-checks passed.');

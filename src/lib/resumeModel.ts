// Pure resume-shape helpers — deliberately no AsyncStorage import here, so
// this stays testable with plain `node` and the reducer doesn't drag in a
// native module just to reorder an array.
import type { AIUsage, Resume } from '../types/resume.ts';

export const CURRENT_SCHEMA_VERSION = 1;
const FREE_CREDIT_POOL = 20; // placeholder, per PRD Section 11 open question

export function createEmptyResume(): Resume {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    personalInfo: { name: '', email: '', phone: '', location: '', linkedIn: null },
    sections: [],
    selectedTemplate: 'classic',
    updatedAt: new Date().toISOString(),
  };
}

export function createInitialAIUsage(): AIUsage {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    freeCreditsRemaining: FREE_CREDIT_POOL,
    subscriptionActive: false,
    subscriptionProductId: null,
    lastSyncedAt: new Date().toISOString(),
  };
}

export interface ExportValidation {
  ok: boolean;
  missingField?: 'name' | 'email';
}

// Never export a blank/broken file — PRD.md Section 8. Kept here (not in
// export.ts) so it stays testable without pulling in expo-print/expo-sharing,
// which aren't importable under plain Node.
export function validateForExport(resume: Resume): ExportValidation {
  if (!resume.personalInfo.name.trim()) return { ok: false, missingField: 'name' };
  if (!resume.personalInfo.email.trim()) return { ok: false, missingField: 'email' };
  return { ok: true };
}

// Re-sequences order to 0..n-1 by CURRENT ARRAY POSITION — never trust gaps
// or duplicates left in the stale `order` field (ARCHITECTURE.md Section
// 2.2). Deliberately does not sort by `order` first: callers that just
// reordered the array (REORDER_SECTIONS) rely on array position being the
// new source of truth, not the value this function exists to fix.
export function normalizeSectionOrder(resume: Resume): Resume {
  return {
    ...resume,
    sections: resume.sections.map((section, index) => ({ ...section, order: index })),
  };
}

// Matches ARCHITECTURE.md Section 2 exactly — the on-device schema is the
// contract, not an implementation detail to drift from.

export type SectionType =
  | 'summary'
  | 'education'
  | 'experience'
  | 'projects'
  | 'skills'
  | 'certifications';

export const ALL_SECTION_TYPES: SectionType[] = [
  'summary',
  'education',
  'experience',
  'projects',
  'skills',
  'certifications',
];

export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedIn: string | null;
}

export interface SectionItem {
  title: string;
  subtitle: string | null;
  // Free text on purpose — real resumes have fuzzy/open-ended dates
  // ("Summer 2021", "Present"); see ARCHITECTURE.md Section 2.2.
  dateRange: string;
  bullets: string[];
}

export interface ResumeSection {
  type: SectionType;
  order: number;
  items: SectionItem[];
}

export interface Resume {
  schemaVersion: number;
  personalInfo: PersonalInfo;
  sections: ResumeSection[];
  selectedTemplate: string;
  updatedAt: string;
}

// No `freeCreditsExhausted` field — it's derived (freeCreditsRemaining <= 0),
// never stored, per Vault/WIKI/Things To Avoid.md.
export interface AIUsage {
  schemaVersion: number;
  freeCreditsRemaining: number;
  subscriptionActive: boolean;
  subscriptionProductId: string | null;
  lastSyncedAt: string;
}

export function isAIUsageExhausted(aiUsage: AIUsage): boolean {
  return !aiUsage.subscriptionActive && aiUsage.freeCreditsRemaining <= 0;
}

import type { Resume } from '../types/resume.ts';

export interface ChecklistResult {
  id: string;
  passed: boolean;
  message: string;
}

// One boolean check per row — deterministic, no AI call, per PRD/ARCHITECTURE
// (the ATS "health checklist" must never be a guess). Adding a new check is
// a one-line addition to this array, not a refactor.
const CHECKS: { id: string; check: (resume: Resume) => boolean; pass: string; fail: string }[] = [
  {
    id: 'contact-info',
    check: (r) => r.personalInfo.name.trim().length > 0 && r.personalInfo.email.trim().length > 0,
    pass: 'Contact info present',
    fail: 'Add your name and email',
  },
  {
    id: 'has-sections',
    check: (r) => r.sections.length > 0,
    pass: 'Standard section headings',
    fail: 'Add at least one section (Experience, Education, ...)',
  },
  {
    id: 'reasonable-length',
    check: (r) => r.sections.flatMap((s) => s.items.flatMap((i) => i.bullets)).filter((b) => b.trim()).length >= 2,
    pass: 'Resume has enough content',
    fail: 'Resume is a bit short — add 1-2 more bullets',
  },
];

export function runChecklist(resume: Resume): ChecklistResult[] {
  return CHECKS.map(({ id, check, pass, fail }) => {
    const passed = check(resume);
    return { id, passed, message: passed ? pass : fail };
  });
}

export interface JDMatchResult {
  matchPercent: number;
  matched: string[];
  missing: string[];
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'is', 'are', 'to', 'of', 'in', 'for', 'with', 'on', 'as', 'be', 'this',
  'that', 'we', 'you', 'will', 'have', 'has', 'at', 'by', 'from', 'our', 'your', 'it', 'their', 'looking',
  'strong', 'plus', 'experience', 'skills',
]);

function tokenize(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s/+-]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 1 && !STOPWORDS.has(w))
    )
  );
}

// Naive overlap, no stemming/NLP library — per TRD.md Section 6, upgrade
// only if this is measurably too noisy against real job descriptions.
export function matchJobDescription(resume: Resume, jobDescription: string): JDMatchResult | null {
  const jdText = jobDescription.trim();
  if (jdText.length < 20) return null; // too short/garbage to score meaningfully

  const jdTokens = tokenize(jdText);
  if (jdTokens.length === 0) return null;

  const resumeText = [
    resume.personalInfo.name,
    ...resume.sections.flatMap((s) =>
      s.items.flatMap((i) => [i.title ?? '', i.subtitle ?? '', ...i.bullets])
    ),
  ].join(' ');
  const resumeTokens = new Set(tokenize(resumeText));

  const matched = jdTokens.filter((t) => resumeTokens.has(t));
  const missing = jdTokens.filter((t) => !resumeTokens.has(t));
  const matchPercent = Math.round((matched.length / jdTokens.length) * 100);

  return { matchPercent, matched, missing };
}

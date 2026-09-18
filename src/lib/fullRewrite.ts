import { rewriteText } from './ai.ts';
import type { Resume } from '../types/resume.ts';

export interface FullRewriteProgress {
  done: number;
  total: number;
}

export interface FullRewriteResult {
  resume: Resume;
  rewrittenCount: number;
  failedCount: number;
}

// Full Rewrite reuses the existing single-bullet /rewrite call, looped
// across every bullet with the job description attached as context —
// deliberately not a new "rewrite the whole resume as JSON" endpoint. That
// would need a riskier round-trip (Gemini returning well-formed JSON for an
// entire resume) for what a loop over the already-reliable per-bullet call
// does just as well, one API contract instead of two.
export async function fullRewriteResume(
  resume: Resume,
  jobDescription: string,
  onProgress?: (progress: FullRewriteProgress) => void
): Promise<FullRewriteResult> {
  const total = resume.sections.reduce(
    (sum, section) => sum + section.items.reduce((s, item) => s + item.bullets.filter((b) => b.trim()).length, 0),
    0
  );

  let done = 0;
  let rewrittenCount = 0;
  let failedCount = 0;

  const sections = [];
  for (const section of resume.sections) {
    const items = [];
    for (const item of section.items) {
      const bullets = [];
      for (const bullet of item.bullets) {
        if (!bullet.trim()) {
          bullets.push(bullet);
          continue;
        }
        const result = await rewriteText(section.type, bullet, jobDescription);
        if (result.ok) {
          bullets.push(result.text);
          rewrittenCount++;
        } else {
          bullets.push(bullet);
          failedCount++;
        }
        done++;
        onProgress?.({ done, total });
      }
      items.push({ ...item, bullets });
    }
    sections.push({ ...section, items });
  }

  return { resume: { ...resume, sections }, rewrittenCount, failedCount };
}

import type { PersonalInfo, ResumeSection, SectionType } from '../types/resume.ts';

const REQUEST_TIMEOUT_MS = 10000;
// Parsing a whole resume takes longer than one bullet — give Gemini more
// room before giving up. Must stay above the Worker's own Gemini-call
// timeout (25s, worker/src/index.js) or the client aborts first.
const IMPORT_TIMEOUT_MS = 30000;

export type RewriteResult = { ok: true; text: string } | { ok: false };

// Any failure (timeout, network, non-200) falls back to the caller keeping
// the user's original text — never surfaced as anything but a generic
// retry message (ARCHITECTURE.md Section 4.1). The specific error code is
// intentionally discarded here, not surfaced to the UI.
export async function rewriteText(
  sectionType: SectionType,
  text: string,
  jobDescription?: string
): Promise<RewriteResult> {
  const workerUrl = process.env.EXPO_PUBLIC_WORKER_URL;
  const sharedSecret = process.env.EXPO_PUBLIC_APP_SHARED_SECRET;
  if (!workerUrl) return { ok: false };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${workerUrl}/rewrite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-App-Secret': sharedSecret ?? '' },
      body: JSON.stringify({ sectionType, text, jobDescription }),
      signal: controller.signal,
    });
    if (!res.ok) return { ok: false };
    const data = (await res.json()) as { rewrittenText?: string };
    if (!data.rewrittenText) return { ok: false };
    return { ok: true, text: data.rewrittenText };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(timeout);
  }
}

type ImportFailureReason = 'empty_text' | 'text_too_long' | 'daily_cap_reached' | 'parse_failed' | 'network';

export type ImportResult =
  | { ok: true; personalInfo: PersonalInfo; sections: ResumeSection[] }
  | { ok: false; reason?: ImportFailureReason };

// Unlike rewriteText, the caller shows a distinct message per reason — this
// is a one-shot, deliberate action (not an inline per-bullet retry), so a
// slightly more specific failure message is worth the extra surface area.
export async function importResumeText(text: string): Promise<ImportResult> {
  const workerUrl = process.env.EXPO_PUBLIC_WORKER_URL;
  const sharedSecret = process.env.EXPO_PUBLIC_APP_SHARED_SECRET;
  if (!workerUrl) return { ok: false, reason: 'network' };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IMPORT_TIMEOUT_MS);

  try {
    const res = await fetch(`${workerUrl}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-App-Secret': sharedSecret ?? '' },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
    const data = (await res.json().catch(() => ({}))) as {
      resume?: { personalInfo: PersonalInfo; sections: ResumeSection[] };
      error?: ImportFailureReason;
    };
    if (!res.ok || !data.resume) {
      return { ok: false, reason: data.error };
    }
    return { ok: true, personalInfo: data.resume.personalInfo, sections: data.resume.sections };
  } catch {
    return { ok: false, reason: 'network' };
  } finally {
    clearTimeout(timeout);
  }
}

import type { SectionType } from '../types/resume.ts';

const REQUEST_TIMEOUT_MS = 10000;

export type RewriteResult = { ok: true; text: string } | { ok: false };

// Any failure (timeout, network, non-200) falls back to the caller keeping
// the user's original text — never surfaced as anything but a generic
// retry message (ARCHITECTURE.md Section 4.1). The specific error code is
// intentionally discarded here, not surfaced to the UI.
export async function rewriteText(sectionType: SectionType, text: string): Promise<RewriteResult> {
  const workerUrl = process.env.EXPO_PUBLIC_WORKER_URL;
  const sharedSecret = process.env.EXPO_PUBLIC_APP_SHARED_SECRET;
  if (!workerUrl) return { ok: false };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${workerUrl}/rewrite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-App-Secret': sharedSecret ?? '' },
      body: JSON.stringify({ sectionType, text }),
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

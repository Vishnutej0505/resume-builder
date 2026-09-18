import { buildPrompt } from './prompts.js';

const MAX_TEXT_LENGTH = 2000;
// ponytail: fixed budget, no per-IP breakdown — one global daily ceiling is
// the whole point (ARCHITECTURE.md Section 5: caps worst-case Gemini spend
// even if the shared secret leaks). Retune once real usage data exists.
const DAILY_CAP = 500;
const GEMINI_MODEL = 'gemini-2.5-flash-lite';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method !== 'POST' || url.pathname !== '/rewrite') {
      return new Response('Not found', { status: 404 });
    }

    if (request.headers.get('X-App-Secret') !== env.APP_SHARED_SECRET) {
      return Response.json({ error: 'invalid_secret' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'empty_text' }, { status: 400 });
    }

    const { sectionType, text } = body ?? {};
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return Response.json({ error: 'empty_text' }, { status: 400 });
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return Response.json({ error: 'text_too_long' }, { status: 400 });
    }

    if (await isOverDailyCap(env.USAGE_KV)) {
      return Response.json({ error: 'daily_cap_reached' }, { status: 429 });
    }

    // Counted before the call, not after: a request that reaches Gemini
    // (even one that then fails) still spent part of the daily budget, and
    // counting it stops a broken-Gemini retry storm from bypassing the cap.
    await incrementDailyUsage(env.USAGE_KV);

    try {
      const rewrittenText = await callGemini(env.GEMINI_API_KEY, sectionType, text);
      return Response.json({ rewrittenText });
    } catch {
      return Response.json({ error: 'upstream_error' }, { status: 502 });
    }
  },
};

function todayKey() {
  return `usage:${new Date().toISOString().slice(0, 10)}`;
}

async function isOverDailyCap(kv) {
  const raw = await kv.get(todayKey());
  return (raw ? parseInt(raw, 10) : 0) >= DAILY_CAP;
}

async function incrementDailyUsage(kv) {
  const key = todayKey();
  const raw = await kv.get(key);
  const count = raw ? parseInt(raw, 10) : 0;
  // ponytail: read-then-write race under concurrent requests near the cap
  // boundary — acceptable slack for a personal-scale proxy, not a ledger.
  await kv.put(key, String(count + 1), { expirationTtl: 172800 });
}

async function callGemini(apiKey, sectionType, text) {
  const prompt = buildPrompt(sectionType, text);
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4 },
      }),
      signal: AbortSignal.timeout(10000),
    }
  );

  if (!res.ok) throw new Error(`Gemini responded ${res.status}`);

  const data = await res.json();
  const rewritten = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!rewritten) throw new Error('Gemini returned no text');
  return rewritten;
}

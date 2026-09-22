import { buildPrompt, buildImportPrompt } from './prompts.js';

const MAX_TEXT_LENGTH = 2000;
const MAX_JD_LENGTH = 6000;
const MAX_IMPORT_LENGTH = 8000;
const MIN_IMPORT_LENGTH = 50;
const ALLOWED_SECTION_TYPES = new Set([
  'summary',
  'education',
  'experience',
  'projects',
  'skills',
  'certifications',
]);
// ponytail: fixed budget, no per-IP breakdown — one global daily ceiling is
// the whole point (ARCHITECTURE.md Section 5: caps worst-case Gemini spend
// even if the shared secret leaks). Retune once real usage data exists.
const DAILY_CAP = 500;
// Google deprecated gemini-2.5-flash-lite for new API keys (Sept 2026) in
// favor of this model — see Vault/WIKI/AI Architecture.md for the story.
const GEMINI_MODEL = 'gemini-3.5-flash-lite';

// CORS is a browser-only concern (a native app's fetch isn't subject to it)
// — enabled purely so `expo start --web` dev-preview testing works too. The
// shared secret, not CORS, is what actually gates the endpoint.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-App-Secret',
};

function json(body, status = 200) {
  return Response.json(body, { status, headers: CORS_HEADERS });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return new Response('Not found', { status: 404 });
    }

    if (request.headers.get('X-App-Secret') !== env.APP_SHARED_SECRET) {
      return json({ error: 'invalid_secret' }, 401);
    }

    if (url.pathname === '/rewrite') return handleRewrite(request, env);
    if (url.pathname === '/import') return handleImport(request, env);
    return new Response('Not found', { status: 404 });
  },
};

async function handleRewrite(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'empty_text' }, 400);
  }

  const { sectionType, text, jobDescription } = body ?? {};
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return json({ error: 'empty_text' }, 400);
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return json({ error: 'text_too_long' }, 400);
  }
  if (jobDescription != null && (typeof jobDescription !== 'string' || jobDescription.length > MAX_JD_LENGTH)) {
    return json({ error: 'text_too_long' }, 400);
  }

  if (await isOverDailyCap(env.USAGE_KV)) {
    return json({ error: 'daily_cap_reached' }, 429);
  }

  // Counted before the call, not after: a request that reaches Gemini
  // (even one that then fails) still spent part of the daily budget, and
  // counting it stops a broken-Gemini retry storm from bypassing the cap.
  await incrementDailyUsage(env.USAGE_KV);

  try {
    const rewrittenText = await callGemini(env.GEMINI_API_KEY, buildPrompt(sectionType, text, jobDescription));
    return json({ rewrittenText });
  } catch {
    return json({ error: 'upstream_error' }, 502);
  }
}

async function handleImport(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'empty_text' }, 400);
  }

  const { text } = body ?? {};
  if (!text || typeof text !== 'string' || text.trim().length < MIN_IMPORT_LENGTH) {
    return json({ error: 'empty_text' }, 400);
  }
  if (text.length > MAX_IMPORT_LENGTH) {
    return json({ error: 'text_too_long' }, 400);
  }

  if (await isOverDailyCap(env.USAGE_KV)) {
    return json({ error: 'daily_cap_reached' }, 429);
  }
  await incrementDailyUsage(env.USAGE_KV);

  try {
    // A whole-resume JSON parse takes longer than one bullet — give it more room.
    const raw = await callGemini(env.GEMINI_API_KEY, buildImportPrompt(text), 25000);
    const resume = parseAndSanitizeImport(raw);
    if (!resume) return json({ error: 'parse_failed' }, 502);
    return json({ resume });
  } catch {
    return json({ error: 'upstream_error' }, 502);
  }
}

// Gemini sometimes wraps JSON in ```json fences despite instructions not to
// — strip them before parsing rather than treating it as a hard failure.
function parseAndSanitizeImport(raw) {
  const stripped = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  let data;
  try {
    data = JSON.parse(stripped);
  } catch {
    return null;
  }
  if (!data || typeof data !== 'object') return null;

  const p = data.personalInfo ?? {};
  const personalInfo = {
    name: typeof p.name === 'string' ? p.name : '',
    email: typeof p.email === 'string' ? p.email : '',
    phone: typeof p.phone === 'string' ? p.phone : '',
    location: typeof p.location === 'string' ? p.location : '',
    linkedIn: typeof p.linkedIn === 'string' ? p.linkedIn : null,
  };

  const rawSections = Array.isArray(data.sections) ? data.sections : [];
  const sections = rawSections
    .filter((s) => s && ALLOWED_SECTION_TYPES.has(s.type) && Array.isArray(s.items) && s.items.length > 0)
    .map((s, index) => ({
      type: s.type,
      order: index,
      items: s.items.map((item) => ({
        title: typeof item?.title === 'string' ? item.title : '',
        subtitle: typeof item?.subtitle === 'string' ? item.subtitle : null,
        dateRange: typeof item?.dateRange === 'string' ? item.dateRange : '',
        bullets: Array.isArray(item?.bullets) ? item.bullets.filter((b) => typeof b === 'string') : [],
      })),
    }));

  return { personalInfo, sections };
}

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

async function callGemini(apiKey, prompt, timeoutMs = 10000) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4 },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    }
  );

  if (!res.ok) {
    const bodyText = await res.text();
    throw new Error(`Gemini responded ${res.status}: ${bodyText.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error('Gemini returned no text');
  return text;
}

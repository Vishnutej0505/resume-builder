// No framework — assert-based self-check per the branches in index.js
// (secret check, validation, daily cap, Gemini success/failure).
// Run: node src/index.test.js
import assert from 'node:assert';
import worker from './index.js';

function makeKv(initial = {}) {
  const store = { ...initial };
  return {
    async get(key) {
      return store[key] ?? null;
    },
    async put(key, value) {
      store[key] = value;
    },
    _store: store,
  };
}

const env = { APP_SHARED_SECRET: 'test-secret', GEMINI_API_KEY: 'fake-key', USAGE_KV: makeKv() };

function req(body, { secret = 'test-secret' } = {}) {
  return new Request('https://worker.example/rewrite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-App-Secret': secret },
    body: JSON.stringify(body),
  });
}

async function run() {
  // wrong secret -> 401
  let res = await worker.fetch(req({ text: 'hi' }, { secret: 'wrong' }), env);
  assert.strictEqual(res.status, 401);

  // empty text -> 400
  res = await worker.fetch(req({ text: '' }), env);
  assert.strictEqual(res.status, 400);

  // too long -> 400
  res = await worker.fetch(req({ text: 'x'.repeat(2001) }), env);
  assert.strictEqual(res.status, 400);

  // success path (mock fetch so no real Gemini call happens)
  const realFetch = global.fetch;
  global.fetch = async () =>
    new Response(
      JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Rewritten bullet.' }] } }] }),
      { status: 200 }
    );
  res = await worker.fetch(req({ sectionType: 'experience', text: 'did stuff' }), env);
  assert.strictEqual(res.status, 200);
  const okBody = await res.json();
  assert.strictEqual(okBody.rewrittenText, 'Rewritten bullet.');

  // Gemini failure -> 502, original text untouched by design (client-side concern, not tested here)
  global.fetch = async () => new Response('error', { status: 500 });
  res = await worker.fetch(req({ sectionType: 'experience', text: 'did stuff' }), env);
  assert.strictEqual(res.status, 502);
  global.fetch = realFetch;

  // daily cap reached -> 429
  const cappedEnv = { ...env, USAGE_KV: makeKv({ [`usage:${new Date().toISOString().slice(0, 10)}`]: '500' }) };
  res = await worker.fetch(req({ text: 'did stuff' }), cappedEnv);
  assert.strictEqual(res.status, 429);

  console.log('All worker self-checks passed.');
}

run();

// No framework — assert-based self-check for importResumeText's branches.
import assert from 'node:assert';
import { importResumeText } from './ai.ts';

process.env.EXPO_PUBLIC_WORKER_URL = 'https://worker.example';
process.env.EXPO_PUBLIC_APP_SHARED_SECRET = 'secret';

async function run() {
  // success
  global.fetch = (async () =>
    new Response(
      JSON.stringify({
        resume: {
          personalInfo: { name: 'Aditi', email: 'a@x.com', phone: '', location: '', linkedIn: null },
          sections: [{ type: 'experience', order: 0, items: [] }],
        },
      }),
      { status: 200 }
    )) as typeof fetch;
  let result = await importResumeText('x'.repeat(60));
  assert.ok(result.ok);
  if (result.ok) assert.strictEqual(result.personalInfo.name, 'Aditi');

  // worker error with a reason -> surfaced, not swallowed
  global.fetch = (async () =>
    new Response(JSON.stringify({ error: 'parse_failed' }), { status: 502 })) as typeof fetch;
  result = await importResumeText('x'.repeat(60));
  assert.strictEqual(result.ok, false);
  if (!result.ok) assert.strictEqual(result.reason, 'parse_failed');

  // network failure -> reason 'network', never throws
  global.fetch = (async () => {
    throw new Error('boom');
  }) as typeof fetch;
  result = await importResumeText('x'.repeat(60));
  assert.strictEqual(result.ok, false);
  if (!result.ok) assert.strictEqual(result.reason, 'network');

  console.log('All ai.importResumeText self-checks passed.');
}

run();

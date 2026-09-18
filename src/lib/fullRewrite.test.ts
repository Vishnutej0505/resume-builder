// No framework — assert-based self-check. Mocks global fetch the same way
// the reducer/worker self-checks do, since rewriteText() in ai.ts hits the
// network directly.
import assert from 'node:assert';
import { createEmptyResume } from './resumeModel.ts';
import { fullRewriteResume } from './fullRewrite.ts';

process.env.EXPO_PUBLIC_WORKER_URL = 'https://worker.example';
process.env.EXPO_PUBLIC_APP_SHARED_SECRET = 'secret';

const resume = {
  ...createEmptyResume(),
  sections: [
    {
      type: 'experience' as const,
      order: 0,
      items: [
        { title: 'Intern', subtitle: null, dateRange: '2025', bullets: ['did X', '', 'did Y'] },
      ],
    },
    {
      type: 'skills' as const,
      order: 1,
      items: [{ title: '', subtitle: null, dateRange: '', bullets: ['React, Node'] }],
    },
  ],
};

async function run() {
  // All succeed
  global.fetch = (async () =>
    new Response(JSON.stringify({ rewrittenText: 'Tailored.' }), { status: 200 })) as typeof fetch;

  const progressCalls: { done: number; total: number }[] = [];
  const result = await fullRewriteResume(resume, 'Senior Engineer role', (p) => progressCalls.push(p));

  assert.strictEqual(result.rewrittenCount, 3); // did X, did Y, React/Node line
  assert.strictEqual(result.failedCount, 0);
  assert.strictEqual(result.resume.sections[0].items[0].bullets[0], 'Tailored.');
  assert.strictEqual(result.resume.sections[0].items[0].bullets[1], ''); // empty bullet skipped, left as-is
  assert.strictEqual(result.resume.sections[0].items[0].bullets[2], 'Tailored.');
  assert.strictEqual(progressCalls.length, 3);
  assert.deepStrictEqual(progressCalls[2], { done: 3, total: 3 });

  // Original resume object untouched (immutability)
  assert.strictEqual(resume.sections[0].items[0].bullets[0], 'did X');

  // Partial failure: second call fails
  let callCount = 0;
  global.fetch = (async () => {
    callCount++;
    if (callCount === 2) return new Response('error', { status: 500 });
    return new Response(JSON.stringify({ rewrittenText: 'Tailored.' }), { status: 200 });
  }) as typeof fetch;

  const partial = await fullRewriteResume(resume, 'Senior Engineer role');
  assert.strictEqual(partial.rewrittenCount, 2);
  assert.strictEqual(partial.failedCount, 1);

  console.log('All fullRewrite self-checks passed.');
}

run();

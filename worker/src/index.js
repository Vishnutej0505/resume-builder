// Stub proxy — enforces the /rewrite contract shape (ARCHITECTURE.md Section 4.1)
// so env vars and deployment can be verified before the actual Gemini call and
// KV daily-cap logic are built (separate task, not scaffolding).

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

    if (!body?.text || typeof body.text !== 'string' || body.text.length === 0) {
      return Response.json({ error: 'empty_text' }, { status: 400 });
    }
    if (body.text.length > 2000) {
      return Response.json({ error: 'text_too_long' }, { status: 400 });
    }

    // TODO: KV daily-cap check, prompt-per-sectionType build, Gemini call.
    return Response.json({ error: 'upstream_error' }, { status: 502 });
  },
};

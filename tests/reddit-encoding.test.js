import test from 'node:test';
import assert from 'node:assert/strict';
import { loadMatchLinks } from '../src/services/linkService.ts';
import { searchReddit } from '../src/services/redditService.ts';
import { handler } from '../netlify/functions/reddit.js';

for (const name of ['Brighton & Hove Albion', 'São Paulo', 'A+B #1 &sort=top 100%']) {
  test(`search preserves ${name} through both URL boundaries`, async (t) => {
    const upstreamQueries = [];
    const frontendQueries = [];
    t.mock.method(globalThis, 'fetch', async (input) => {
      const url = new URL(input);
      if (url.pathname === '/api/v1/access_token') {
        return Response.json({ access_token: 'test-token' });
      }
      assert.equal(url.origin, 'https://oauth.reddit.com');
      assert.equal(url.pathname, '/r/soccer/search');
      assert.equal(url.hash, '');
      assert.deepEqual([...url.searchParams.keys()], ['q', 'sort', 't', 'restrict_sr']);
      assert.equal(url.searchParams.get('sort'), 'new');
      assert.equal(url.searchParams.get('t'), 'day');
      assert.equal(url.searchParams.get('restrict_sr'), 'on');
      upstreamQueries.push(url.searchParams.get('q'));
      return Response.json({ data: { children: [] } });
    });

    const team = { id: 1, name, longName: `${name} FC` };
    const match = {
      id: 1, home: team, away: { ...team, id: 2 },
      status: { started: true, finished: true, utcTime: '2026-10-31T10:00:00Z' },
    };
    const result = await loadMatchLinks(match, async (input) => {
      const url = new URL(input, 'http://localhost');
      assert.equal(url.hash, '');
      assert.deepEqual([...url.searchParams.keys()], ['query']);
      frontendQueries.push(url.searchParams.get('query'));
      const response = await handler({ queryStringParameters: Object.fromEntries(url.searchParams) });
      return new Response(response.body, { status: response.statusCode });
    });
    assert.equal(result.failures, 0);
    assert.equal(upstreamQueries.length, 2);
    assert.deepEqual(upstreamQueries, frontendQueries);
    assert.ok(upstreamQueries[0].includes(`"${name}"`));
    assert.ok(upstreamQueries[0].includes(`"${name} FC"`));
  });
}

test('standalone Reddit service also encodes its query', async (t) => {
  const query = '"Brighton & Hove Albion"OR"A+B #1"';
  t.mock.method(globalThis, 'fetch', async (input) => {
    const url = new URL(input, 'http://localhost');
    assert.deepEqual([...url.searchParams], [['query', query]]);
    assert.equal(url.hash, '');
    return Response.json({ data: { children: [] } });
  });
  await searchReddit(query);
});

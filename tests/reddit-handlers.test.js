import test from 'node:test';
import assert from 'node:assert/strict';
import { createRedditClient, createSearchHandler, createNewHandler } from '../netlify/lib/reddit.js';

const listing = { data: { children: [] } };
const env = { REDDIT_CLIENT_ID: 'id', REDDIT_CLIENT_SECRET: 'secret' };
const silent = { error() {} };

function fixture({ token = () => Response.json({ access_token: 't1', expires_in: 3600 }),
  api = () => Response.json(listing) } = {}) {
  const calls = { token: 0, api: [] };
  let time = 0;
  const fetcher = async (url, init) => {
    if (url.endsWith('/api/v1/access_token')) {
      calls.token++;
      return token(calls.token);
    }
    calls.api.push({ url, auth: init.headers.Authorization });
    return api(calls.api.length);
  };
  const client = createRedditClient({ fetcher, env, now: () => time });
  return { client, calls, advance: (ms) => { time += ms; } };
}

const search = (query) => ({ queryStringParameters: query === undefined ? {} : { query } });

test('missing or blank query is rejected without calling Reddit', async () => {
  const { client, calls } = fixture();
  const handler = createSearchHandler({ client, logger: silent });
  for (const event of [search(undefined), search(''), search('   '), {}]) {
    const response = await handler(event);
    assert.equal(response.statusCode, 400);
  }
  assert.equal(calls.token, 0);
  assert.equal(calls.api.length, 0);
});

test('successful search and new listings return 200 with the listing', async () => {
  const { client, calls } = fixture();
  const searchResponse = await createSearchHandler({ client })(search('"Arsenal"'));
  const newResponse = await createNewHandler({ client })({});
  for (const response of [searchResponse, newResponse]) {
    assert.equal(response.statusCode, 200);
    assert.deepEqual(JSON.parse(response.body), listing);
  }
  assert.ok(calls.api[1].url.endsWith('/r/soccer/new.json'));
});

const failures = {
  'token request fails': { token: () => new Response('nope', { status: 401 }) },
  'token response has no access_token': { token: () => Response.json({ error: 'invalid_grant' }) },
  'token request throws': { token: () => { throw new Error('network'); } },
  'Reddit returns an error status': { api: () => new Response('busy', { status: 503 }) },
  'Reddit returns an invalid listing': { api: () => Response.json({ error: 429 }) },
};

for (const [name, overrides] of Object.entries(failures)) {
  test(`returns 502 when ${name}`, async () => {
    const { client } = fixture(overrides);
    for (const handler of [createSearchHandler({ client, logger: silent }), createNewHandler({ client, logger: silent })]) {
      const response = await handler(search('"Arsenal"'));
      assert.equal(response.statusCode, 502);
      assert.deepEqual(JSON.parse(response.body), { error: 'Unable to fetch from Reddit.' });
    }
  });
}

test('token is reused until it is about to expire', async () => {
  const { client, calls, advance } = fixture({
    token: (n) => Response.json({ access_token: `t${n}`, expires_in: 3600 }),
  });
  await client.get('/r/soccer/new.json');
  advance(3600 * 1000 - 120 * 1000);
  await client.get('/r/soccer/new.json');
  assert.equal(calls.token, 1);
  advance(60 * 1000);
  await client.get('/r/soccer/new.json');
  assert.equal(calls.token, 2);
  assert.deepEqual(calls.api.map(call => call.auth), ['Bearer t1', 'Bearer t1', 'Bearer t2']);
});

test('a 401 from Reddit refreshes the token and retries once', async () => {
  const { client, calls } = fixture({
    token: (n) => Response.json({ access_token: `t${n}`, expires_in: 3600 }),
    api: (n) => (n === 1 ? new Response('', { status: 401 }) : Response.json(listing)),
  });
  assert.deepEqual(await client.get('/r/soccer/new.json'), listing);
  assert.equal(calls.token, 2);
  assert.deepEqual(calls.api.map(call => call.auth), ['Bearer t1', 'Bearer t2']);
});

test('a token without expires_in is not cached', async () => {
  const { client, calls } = fixture({ token: () => Response.json({ access_token: 't' }) });
  await client.get('/r/soccer/new.json');
  await client.get('/r/soccer/new.json');
  assert.equal(calls.token, 2);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { createMatchesHandler, createFallbackHandler, MAX_CACHE_AGE_MS } from '../netlify/lib/matches.js';

const time = Date.parse('2026-10-28T20:00:00Z');
const event = { queryStringParameters: { date: '20261028', timezone: 'America/Los_Angeles' } };
const data = { leagues: [{ primaryId: 47, name: 'Premier League', matches: [{
  id: 123,
  home: { id: 1, name: 'Home', longName: 'Home FC', score: 1 },
  away: { id: 2, name: 'Away', longName: 'Away FC', score: 0 },
  status: { utcTime: '2026-10-28T19:00:00Z', started: true, finished: false },
}] }] };

function fixture() {
  const entries = new Map();
  const store = {
    async setJSON(key, value) { entries.set(key, structuredClone(value)); },
    async get(key) { return entries.get(key) ?? null; },
  };
  const deps = {
    fetchMatches: async () => ({ ok: true, json: async () => structuredClone(data) }),
    openStore: () => store,
    now: () => time,
    logger: { error() {} },
  };
  return { entries, deps, store };
}

for (const [name, fetchMatches] of [
  ['HTTP error', async () => ({ ok: false, status: 429, json: async () => ({ error: 'limited' }) })],
  ['network error', async () => { throw new Error('offline'); }],
  ['invalid JSON', async () => ({ ok: true, json: async () => { throw new SyntaxError('invalid'); } })],
  ['invalid payload', async () => ({ ok: true, json: async () => ({ leagues: [{}] }) })],
  ['invalid nested match', async () => ({ ok: true, json: async () => ({ leagues: [{ ...data.leagues[0], matches: [{ id: 1 }] }] }) })],
]) {
  test(`${name} leaves the previous cache intact`, async () => {
    const { deps, entries } = fixture();
    await createMatchesHandler(deps)(event);
    const previous = structuredClone([...entries]);
    const response = await createMatchesHandler({ ...deps, fetchMatches })(event);
    assert.equal(response.statusCode, 502);
    assert.deepEqual([...entries], previous);
    assert.equal((await createFallbackHandler(deps)(event)).statusCode, 200);
  });
}

test('fresh results are cached and returned with a timestamp; fallback is labeled', async () => {
  const { deps } = fixture();
  const fresh = await createMatchesHandler(deps)(event);
  assert.equal(fresh.statusCode, 200);
  assert.deepEqual(JSON.parse(fresh.body).leagues, data.leagues);
  assert.equal(JSON.parse(fresh.body).cache.isFallback, false);
  const fallback = JSON.parse((await createFallbackHandler(deps)(event)).body);
  assert.deepEqual(fallback.leagues, data.leagues);
  assert.deepEqual(fallback.cache, { cachedAt: new Date(time).toISOString(), isFallback: true });
});

for (const stage of ['open', 'write']) {
  test(`cache ${stage} failure still returns fresh matches`, async () => {
    const { deps } = fixture();
    deps.openStore = () => {
      if (stage === 'open') throw new Error('unavailable');
      return { async setJSON() { throw new Error('unavailable'); } };
    };
    const result = await createMatchesHandler(deps)(event);
    assert.equal(result.statusCode, 200);
    assert.deepEqual(JSON.parse(result.body).leagues, data.leagues);
  });
}

test('fallback does not cross dates or time zones', async () => {
  const { deps } = fixture();
  await createMatchesHandler(deps)(event);
  for (const query of [{ date: '20261029', timezone: 'America/Los_Angeles' }, { date: '20261028', timezone: 'UTC' }]) {
    const result = await createFallbackHandler(deps)({ queryStringParameters: query });
    assert.equal(result.statusCode, 404);
  }
});

test('missing, expired, corrupt, and future-dated cache entries are rejected', async () => {
  const { deps, entries } = fixture();
  assert.equal((await createFallbackHandler(deps)(event)).statusCode, 404);
  await createMatchesHandler(deps)(event);
  for (const now of [() => time + MAX_CACHE_AGE_MS + 1, () => time - 1]) {
    assert.equal((await createFallbackHandler({ ...deps, now })(event)).statusCode, 404);
  }
  for (const [key, entry] of entries) entries.set(key, { ...entry, data: { error: 'bad' } });
  assert.equal((await createFallbackHandler(deps)(event)).statusCode, 404);
});

test('cache read errors return a controlled failure', async () => {
  const { deps } = fixture();
  deps.openStore = () => { throw new Error('unavailable'); };
  assert.equal((await createFallbackHandler(deps)(event)).statusCode, 503);
});

test('invalid parameters are rejected before accessing upstream or storage', async () => {
  const { deps } = fixture();
  deps.fetchMatches = deps.openStore = () => assert.fail('must not be called');
  for (const query of [null, {}, { date: '20260230', timezone: 'UTC' }, { date: '20261028', timezone: 'invalid' }]) {
    for (const factory of [createMatchesHandler, createFallbackHandler]) {
      assert.equal((await factory(deps)({ queryStringParameters: query })).statusCode, 400);
    }
  }
});

test('an empty valid schedule is accepted', async () => {
  const { deps } = fixture();
  deps.fetchMatches = async () => ({ ok: true, json: async () => ({ leagues: [] }) });
  assert.equal((await createMatchesHandler(deps)(event)).statusCode, 200);
});

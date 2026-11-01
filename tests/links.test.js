import test from 'node:test';
import assert from 'node:assert/strict';
import { loadMatchLinks, mergeLinks } from '../src/services/linkService.ts';

const match = {
  id: 1,
  home: { id: 1, name: 'Home', longName: 'Home FC' },
  away: { id: 2, name: 'Away', longName: 'Away FC' },
  status: { started: true, finished: false, utcTime: '2026-10-31T10:00:00Z' },
};
const post = (id, created = 1793444400) => ({
  title: `Home goal ${id}`, url: `https://example.com/v/${id}`, permalink: `/r/soccer/${id}`, created,
});
const listing = (...posts) => new Response(JSON.stringify({ data: { children: posts.map(data => ({ data })) } }));

for (const failedIndex of [0, 1, 2]) {
  test(`failure in source ${failedIndex + 1} preserves other sources`, async (t) => {
    t.mock.method(console, 'error', () => {});
    let calls = 0;
    const result = await loadMatchLinks(match, async () => {
      const index = calls++;
      return index === failedIndex ? new Response('{}', { status: 429 }) : listing(post(index));
    });
    assert.equal(calls, 3);
    assert.equal(result.failures, 1);
    assert.equal(result.links.length, 2);
    assert.ok(result.links.every(link => link.url !== post(failedIndex).url));
  });
}

test('network, JSON and payload failures are contained and retry can succeed', async (t) => {
  t.mock.method(console, 'error', () => {});
  let calls = 0;
  const result = await loadMatchLinks(match, async () => {
    calls++;
    if (calls === 1) throw new Error('network failure');
    if (calls === 2) return new Response('invalid JSON');
    return new Response(JSON.stringify({ error: 'upstream unavailable' }));
  });
  assert.equal(result.failures, 3);
  assert.deepEqual(result.links, []);
  const retry = await loadMatchLinks(match, async () => listing(post('recovered')));
  assert.equal(retry.failures, 0);
  assert.equal(retry.links.length, 1);
});

test('merging partial results preserves existing links, deduplicates and sorts', () => {
  const previous = [post('old', 1793444500), post('duplicate', 1793444600)];
  const incoming = [post('new', 1793444400), { ...post('duplicate', 1793444600), title: 'Updated title' }];
  const merged = mergeLinks(previous, incoming);
  assert.deepEqual(merged.map(link => link.url), [post('new').url, post('old').url, post('duplicate').url]);
  assert.equal(merged[2].title, 'Updated title');
  assert.deepEqual(mergeLinks(previous, []), previous);
  assert.equal(previous[1].title, 'Home goal duplicate');
});

test('successful empty results are distinct from failed requests', async () => {
  const result = await loadMatchLinks(match, async () => listing());
  assert.equal(result.failures, 0);
  assert.deepEqual(result.links, []);
});

test('finished matches search both teams; upcoming matches make no requests', async () => {
  let calls = 0;
  const fetcher = async () => { calls++; return listing(); };
  const finished = await loadMatchLinks({ ...match, status: { ...match.status, finished: true } }, fetcher);
  assert.equal(finished.requestCount, 2);
  const upcoming = await loadMatchLinks({ ...match, status: { ...match.status, started: false } }, fetcher);
  assert.equal(upcoming.requestCount, 0);
  assert.equal(calls, 2);
});

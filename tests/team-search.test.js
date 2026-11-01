import test from 'node:test';
import assert from 'node:assert/strict';
import { teamSearchQuery } from '../src/utils/string.ts';
import { loadMatchLinks } from '../src/services/linkService.ts';

test('queries use all three names and deduplicate case-insensitively', () => {
  assert.equal(teamSearchQuery('Bournemouth AFC', 'Bournemouth', 'AFC Bournemouth'),
    '"Bournemouth AFC" OR "Bournemouth" OR "AFC Bournemouth"');
  assert.equal(teamSearchQuery('Leeds United', 'Leeds', 'Leeds United'),
    '"Leeds United" OR "Leeds"');
  assert.equal(teamSearchQuery(' Hull ', 'hull', 'Hull City'), '"Hull" OR "Hull City"');
  assert.equal(teamSearchQuery('Manchester United', undefined, 'Manchester United'), '"Manchester United"');
  assert.equal(teamSearchQuery('Hull City', '', 'Hull City'), '"Hull City"');
});

test('short names match recent posts and appear in each team search', async () => {
  const match = {
    id: 1,
    home: { id: 1, name: 'Ipswich Town', shortName: 'Ipswich', longName: 'Ipswich Town' },
    away: { id: 2, name: 'Hull City', shortName: 'Hull', longName: 'Hull City' },
    status: { started: true, finished: false, utcTime: '2026-10-31T10:00:00Z' },
  };
  const queries = [];
  const result = await loadMatchLinks(match, async (input) => {
    const url = new URL(input, 'http://localhost');
    if (url.pathname.endsWith('/redditNew')) {
      return Response.json({ data: { children: [{ data: {
        title: 'Ipswich [1] - 0 Hull', url: 'https://example.com/v/goal',
        permalink: '/r/soccer/goal', created: Date.parse('2026-10-31T10:15:00Z') / 1000,
      } }] } });
    }
    queries.push(url.searchParams.get('query'));
    return Response.json({ data: { children: [] } });
  });
  assert.equal(result.failures, 0);
  assert.equal(result.links[0].title, 'Ipswich [1] - 0 Hull');
  assert.deepEqual(queries, ['"Ipswich Town" OR "Ipswich"', '"Hull City" OR "Hull"']);
});

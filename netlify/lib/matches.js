export const MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000;

const isObject = (value) => value !== null && typeof value === 'object';
const isTeam = (team) => isObject(team) && Number.isFinite(team.id)
  && typeof team.name === 'string' && typeof team.longName === 'string'
  && (team.score == null || Number.isFinite(team.score));

export function isMatchesResponse(data) {
  return isObject(data) && Array.isArray(data.leagues) && data.leagues.every((league) =>
    isObject(league) && Number.isFinite(league.primaryId) && typeof league.name === 'string'
    && Array.isArray(league.matches) && league.matches.every((match) =>
      isObject(match) && Number.isFinite(match.id) && isTeam(match.home) && isTeam(match.away)
      && isObject(match.status) && typeof match.status.utcTime === 'string'
      && Number.isFinite(Date.parse(match.status.utcTime))
      && typeof match.status.started === 'boolean' && typeof match.status.finished === 'boolean'));
}

function parseQuery(event) {
  const { date, timezone } = event.queryStringParameters ?? {};
  if (typeof date !== 'string' || !/^\d{8}$/.test(date) || typeof timezone !== 'string' || !timezone) return null;
  const isoDate = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
  const parsed = new Date(isoDate);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== isoDate) return null;
  try {
    new Intl.DateTimeFormat('en', { timeZone: timezone });
  } catch {
    return null;
  }
  return { date, timezone, key: `${date}/${encodeURIComponent(timezone)}` };
}

function respond(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(body),
  };
}

export function createMatchesHandler({ fetchMatches, openStore, now = Date.now, logger = console }) {
  return async (event) => {
    const query = parseQuery(event);
    if (!query) return respond(400, { error: 'A valid date and time zone are required.' });

    let data;
    try {
      const response = await fetchMatches(query);
      if (!response.ok) throw new Error(`Matches upstream returned ${response.status}`);
      data = await response.json();
      if (!isMatchesResponse(data)) throw new Error('Invalid matches response');
    } catch (error) {
      logger.error('Unable to fetch matches', error);
      return respond(502, { error: 'Unable to fetch matches.' });
    }

    const cachedAt = new Date(now()).toISOString();
    try {
      const store = openStore(event);
      await store.setJSON(query.key, { date: query.date, timezone: query.timezone, cachedAt, data });
    } catch (error) {
      logger.error('Unable to cache matches', error);
    }
    return respond(200, { ...data, cache: { cachedAt, isFallback: false } });
  };
}

export function createFallbackHandler({ openStore, now = Date.now, logger = console }) {
  return async (event) => {
    const query = parseQuery(event);
    if (!query) return respond(400, { error: 'A valid date and time zone are required.' });
    try {
      const entry = await openStore(event).get(query.key, { type: 'json' });
      const age = now() - Date.parse(entry?.cachedAt);
      if (!entry || entry.date !== query.date || entry.timezone !== query.timezone
        || !Number.isFinite(age) || age < 0 || age > MAX_CACHE_AGE_MS || !isMatchesResponse(entry.data)) {
        return respond(404, { error: 'No recent cached matches are available.' });
      }
      return respond(200, { ...entry.data, cache: { cachedAt: entry.cachedAt, isFallback: true } });
    } catch (error) {
      logger.error('Unable to read cached matches', error);
      return respond(503, { error: 'Cached matches are unavailable.' });
    }
  };
}

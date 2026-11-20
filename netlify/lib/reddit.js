const USER_AGENT = 'https://github.com/danielkshin/instant-goals';
const TIMEOUT_MS = 8000;
// Refresh the token this long before Reddit says it expires.
const TOKEN_EXPIRY_MARGIN_MS = 60 * 1000;

function respond(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(body),
  };
}

export function createRedditClient({
  fetcher = (...args) => fetch(...args),
  now = Date.now,
  env = process.env,
} = {}) {
  let cached = null;

  async function getToken() {
    if (cached && now() < cached.expiresAt) return cached.token;
    const auth = Buffer.from(`${env.REDDIT_CLIENT_ID}:${env.REDDIT_CLIENT_SECRET}`).toString('base64');
    const response = await fetcher('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT,
      },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`Reddit token request returned ${response.status}`);
    const data = await response.json();
    if (typeof data?.access_token !== 'string' || !data.access_token) {
      throw new Error('Reddit token response had no access_token');
    }
    const expiresInMs = Number.isFinite(data.expires_in) ? data.expires_in * 1000 : 0;
    cached = { token: data.access_token, expiresAt: now() + expiresInMs - TOKEN_EXPIRY_MARGIN_MS };
    return cached.token;
  }

  async function get(path) {
    const request = async (token) => fetcher(`https://oauth.reddit.com${path}`, {
      headers: { Authorization: `Bearer ${token}`, 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    let response = await request(await getToken());
    if (response.status === 401) {
      // A cached token may have been revoked early; retry once with a fresh one.
      cached = null;
      response = await request(await getToken());
    }
    if (!response.ok) throw new Error(`Reddit returned ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data?.data?.children)) throw new Error('Invalid Reddit listing');
    return data;
  }

  return { get };
}

function createHandler(buildPath, { client = createRedditClient(), logger = console } = {}) {
  return async (event) => {
    const path = buildPath(event);
    if (!path) return respond(400, { error: 'A non-empty query is required.' });
    try {
      return respond(200, await client.get(path));
    } catch (error) {
      logger.error('Unable to fetch from Reddit', error);
      return respond(502, { error: 'Unable to fetch from Reddit.' });
    }
  };
}

export const createSearchHandler = (options) => createHandler((event) => {
  const query = event.queryStringParameters?.query;
  if (typeof query !== 'string' || !query.trim()) return null;
  const params = new URLSearchParams({ q: query, sort: 'new', t: 'day', restrict_sr: 'on' });
  return `/r/soccer/search?${params}`;
}, options);

export const createNewHandler = (options) => createHandler(() => '/r/soccer/new.json?limit=100', options);

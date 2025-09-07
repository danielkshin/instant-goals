exports.handler = async function (event) {
  const query = event.queryStringParameters.query;

  const auth = Buffer.from(
    `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
  ).toString('base64');

  const tokenResponse = await fetch(
    'https://www.reddit.com/api/v1/access_token',
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'https://github.com/danielkshin/instant-goals',
      },
      body: 'grant_type=client_credentials',
    }
  );

  const tokenData = await tokenResponse.json();
  const token = tokenData.access_token;

  const redditResponse = await fetch(
    `https://oauth.reddit.com/r/soccer/search?q=${query}&sort=new&t=day&restrict_sr=on`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'https://github.com/danielkshin/instant-goals',
      },
    }
  );

  const json = await redditResponse.json();

  return {
    statusCode: 200,
    body: JSON.stringify(json),
  };
};

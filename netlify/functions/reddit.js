exports.handler = async function (event) {
  const query = event.queryStringParameters.query;
  const response = await fetch(
    `https://old.reddit.com/r/soccer/search.json?q=${query}&type=link&sort=new&t=day&restrict_sr=on`
  );

  const json = await response.json();

  return {
    statusCode: 200,
    body: JSON.stringify(json),
  };
};

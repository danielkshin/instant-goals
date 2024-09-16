exports.handler = async function (event, context) {
  const date = event.queryStringParameters.date;
  const response = await fetch(
    `https://www.fotmob.com/api/matches?date=${date}`
  );
  const json = await response.json();
  return {
    statusCode: 200,
    body: JSON.stringify(json),
  };
};

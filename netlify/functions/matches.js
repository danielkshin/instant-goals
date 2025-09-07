import { connectLambda, getStore } from '@netlify/blobs';

exports.handler = async function (event) {
  connectLambda(event);

  const date = event.queryStringParameters.date;
  const response = await fetch(
    `https://www.fotmob.com/api/matches?date=${date}`,
    {
      headers: {
        'X-Mas': process.env.XMAS,
      },
    }
  );

  const json = await response.json();

  const matchesBlob = getStore('matches');
  await matchesBlob.setJSON('matches', json);

  return {
    statusCode: 200,
    body: JSON.stringify(json),
  };
};

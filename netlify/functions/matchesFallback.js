import { connectLambda, getStore } from '@netlify/blobs';

exports.handler = async function (event) {
  connectLambda(event);

  const matchesBlob = getStore('matches');
  const json = await matchesBlob.get('matches', { type: 'json' });

  return {
    statusCode: 200,
    body: JSON.stringify(json),
  };
};

exports.handler = async function () {
  const response = await fetch(`https://old.reddit.com/r/soccer/new.json`);

  const json = await response.json();

  return {
    statusCode: 200,
    body: JSON.stringify(json),
  };
};

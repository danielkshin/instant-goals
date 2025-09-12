import { connectLambda, getStore } from '@netlify/blobs';

const crypto = require('crypto');

// https://github.com/MieszkoPugowski/FMScraper/blob/main/fmscraper/xmas_generator.py
function generateXmasHeader(url) {
  const H_LYRICS = `[Spoken Intro: Alan Hansen & Trevor Brooking]
I think it's bad news for the English game
We're not creative enough, and we're not positive enough

[Refrain: Ian Broudie & Jimmy Hill]
It's coming home, it's coming home, it's coming
Football's coming home (We'll go on getting bad results)
It's coming home, it's coming home, it's coming
Football's coming home
It's coming home, it's coming home, it's coming
Football's coming home
It's coming home, it's coming home, it's coming
Football's coming home

[Verse 1: Frank Skinner]
Everyone seems to know the score, they've seen it all before
They just know, they're so sure
That England's gonna throw it away, gonna blow it away
But I know they can play, 'cause I remember

[Chorus: All]
Three lions on a shirt
Jules Rimet still gleaming
Thirty years of hurt
Never stopped me dreaming

[Verse 2: David Baddiel]
So many jokes, so many sneers
But all those "Oh, so near"s wear you down through the years
But I still see that tackle by Moore and when Lineker scored
Bobby belting the ball, and Nobby dancing

[Chorus: All]
Three lions on a shirt
Jules Rimet still gleaming
Thirty years of hurt
Never stopped me dreaming

[Bridge]
England have done it, in the last minute of extra time!
What a save, Gordon Banks!
Good old England, England that couldn't play football!
England have got it in the bag!
I know that was then, but it could be again

[Refrain: Ian Broudie]
It's coming home, it's coming
Football's coming home
It's coming home, it's coming home, it's coming
Football's coming home
(England have done it!)
It's coming home, it's coming home, it's coming
Football's coming home
It's coming home, it's coming home, it's coming
Football's coming home
[Chorus: All]
(It's coming home) Three lions on a shirt
(It's coming home, it's coming) Jules Rimet still gleaming
(Football's coming home
It's coming home) Thirty years of hurt
(It's coming home, it's coming) Never stopped me dreaming
(Football's coming home
It's coming home) Three lions on a shirt
(It's coming home, it's coming) Jules Rimet still gleaming
(Football's coming home
It's coming home) Thirty years of hurt
(It's coming home, it's coming) Never stopped me dreaming
(Football's coming home
It's coming home) Three lions on a shirt
(It's coming home, it's coming) Jules Rimet still gleaming
(Football's coming home
It's coming home) Thirty years of hurt
(It's coming home, it's coming) Never stopped me dreaming
(Football's coming home)`;

  const body = {
    url: url,
    code: Date.now(),
    foo: process.env.X_CLIENT_VERSION,
  };

  const jsonBody = JSON.stringify(body);
  const hash = crypto.createHash('md5');
  hash.update(jsonBody + H_LYRICS);
  const signature = hash.digest('hex').toUpperCase();

  const headerObj = {
    body: body,
    signature: signature,
  };

  const jsonHeader = JSON.stringify(headerObj);
  const xmas = Buffer.from(jsonHeader).toString('base64');

  return xmas;
}

exports.handler = async function (event) {
  connectLambda(event);

  const date = event.queryStringParameters.date;
  const timezone = event.queryStringParameters.timezone;
  const response = await fetch(
    `https://www.fotmob.com/api/matches?date=${date}&timezone=${timezone}`,
    {
      headers: {
        'X-Mas': generateXmasHeader('https://www.fotmob.com/api/matches'),
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

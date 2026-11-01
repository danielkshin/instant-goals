import { connectLambda, getStore } from '@netlify/blobs';
import { createFallbackHandler } from '../lib/matches.js';

export const handler = createFallbackHandler({
  openStore: (event) => {
    connectLambda(event);
    return getStore('matches');
  },
});

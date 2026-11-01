export const fetchRedditNew = async () => {
    const response = await fetch('/.netlify/functions/redditNew');
    return response.json();
};

export const searchReddit = async (query: string) => {
    const params = new URLSearchParams({ query });
    const response = await fetch(
        `/.netlify/functions/reddit?${params}`
    );
    return response.json();
};

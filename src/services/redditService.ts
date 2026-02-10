export const fetchRedditNew = async () => {
    const response = await fetch('/.netlify/functions/redditNew');
    return response.json();
};

export const searchReddit = async (query: string) => {
    const response = await fetch(
        `/.netlify/functions/reddit?query=${query}`
    );
    return response.json();
};
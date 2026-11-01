const requestMatches = async (endpoint: string, date: string, timezone: string) => {
    const query = new URLSearchParams({ date, timezone });
    const response = await fetch(`/.netlify/functions/${endpoint}?${query}`);
    if (!response.ok) {
        throw new Error(`Matches request failed (${response.status})`);
    }
    return response.json();
};

export const fetchMatches = (date: string, timezone: string) =>
    requestMatches('matches', date, timezone);

export const fetchMatchesFallback = (date: string, timezone: string) =>
    requestMatches('matchesFallback', date, timezone);

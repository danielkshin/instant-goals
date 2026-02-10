export const fetchMatches = async (date: string, timezone: string) => {
    const response = await fetch(
        `/.netlify/functions/matches?date=${date}&timezone=${timezone}`
    );
    return response.json();
};

export const fetchMatchesFallback = async () => {
    const response = await fetch('/.netlify/functions/matchesFallback');
    return response.json();
};
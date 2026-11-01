import type { LinkData, MatchData } from '../types/index.ts';
import { filterLinks, sortLinks } from '../utils/links.ts';
import { removeAccents, teamSearchQuery } from '../utils/string.ts';

export const mergeLinks = (previous: LinkData[], incoming: LinkData[]) =>
    sortLinks([...new Map([...previous, ...incoming].map(link => [link.url, link])).values()]);

export async function loadMatchLinks(match: MatchData, fetcher = fetch) {
    const { home, away, status } = match;
    const requests: { url: string; filterTeam: boolean }[] = [];
    const teamNames = [home.name, home.shortName, home.longName, away.name, away.shortName, away.longName]
        .map(name => removeAccents(name?.trim().toLowerCase() ?? '')).filter(Boolean);

    if (status.started && !status.finished) {
        requests.push({ url: '/.netlify/functions/redditNew', filterTeam: true });
    }
    if (status.started || status.finished) {
        for (const team of [home, away]) {
            const query = teamSearchQuery(team.name, team.shortName, team.longName);
            const params = new URLSearchParams({ query });
            requests.push({ url: `/.netlify/functions/reddit?${params}`, filterTeam: false });
        }
    }

    let links: LinkData[] = [];
    let failures = 0;
    for (const request of requests) {
        try {
            const response = await fetcher(request.url, { signal: AbortSignal.timeout(10_000) });
            if (!response.ok) throw new Error(`Reddit request failed (${response.status})`);
            const json = await response.json();
            if (!Array.isArray(json?.data?.children)) throw new Error('Invalid Reddit listing');
            const found: LinkData[] = [];
            for (const child of json.data.children) {
                const post = child?.data;
                if (!post || typeof post.title !== 'string' || typeof post.url !== 'string'
                    || typeof post.permalink !== 'string' || !Number.isFinite(post.created)) {
                    throw new Error('Invalid Reddit post');
                }
                if (filterLinks(post, match) && (!request.filterTeam
                    || teamNames.some(name => removeAccents(post.title.toLowerCase()).includes(name)))) {
                    found.push({ title: post.title, url: post.url, permalink: post.permalink, created: post.created });
                }
            }
            links = mergeLinks(links, found);
        } catch (error) {
            console.error(error);
            failures++;
        }
    }
    return { links, failures, requestCount: requests.length };
}

import { LinkData, MatchData } from "types";

export const filterLinks = (data: any, match: MatchData): boolean => {
    return (
        // exclude U19, U21, and women's teams
        !(
            data.title.includes('U19') ||
            data.title.includes('U21') ||
            data.title.includes(' W ')
        ) &&
        // check for video links
        (data.url.includes('/v/') ||
            data.url.includes('/c/') ||
            data.url.includes('v.redd.it') ||
            data.url.includes('stream') ||
            data.url.includes('goal')) &&
        // no crossposts
        !data.hasOwnProperty('crosspost_parent') &&
        // posted during or after the game
        data.created * 1000 > Date.parse(match.status.utcTime)
    );
};

export const sortLinks = (links: LinkData[]): LinkData[] => {
    return links.sort((a, b) => a.created - b.created);
}
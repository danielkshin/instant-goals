import { useState } from "react";
import { LinkData, MatchData } from "types";
import { filterLinks, sortLinks } from "utils/links";
import { removeAccents, trimTeamName } from "utils/string";

export const useLinks = (match: MatchData, displayError: () => void) => {
    const [links, setLinks] = useState<LinkData[]>([]);
    const [loadingLinks, setLoadingLinks] = useState(false);

    const loadLinks = async (): Promise<void> => {
        setLoadingLinks(true);
        setLinks([]);

        try {
            let newLinks: LinkData[] = [];
            const { home, away, status } = match;

            // Search r/soccer by new (instant updates) during the game
            if (status.started && !status.finished) {
                const teamNames = new Set([
                    removeAccents(trimTeamName(home.name)),
                    removeAccents(trimTeamName(away.name)),
                    removeAccents(trimTeamName(home.longName)),
                    removeAccents(trimTeamName(away.longName)),
                ]);
                const response = await fetch('/.netlify/functions/redditNew');
                const json = await response.json();
                for (const child of json.data.children) {
                    // If the link title contains any of the team names
                    if (
                        filterLinks(child.data, match) &&
                        [...teamNames].some((name) => removeAccents(child.data.title.toLowerCase()).includes(name))
                    ) {
                        newLinks.push({
                            title: child.data.title,
                            url: child.data.url,
                            permalink: child.data.permalink,
                            created: child.data.created,
                        });
                    }
                }
            }

            // Search r/soccer by Reddit's search API (delayed updates) during / after the game
            if (status.started || status.finished) {
                const searchQueries = [
                    `"${home.name}"OR"${home.longName}"`,
                    `"${away.name}"OR"${away.longName}"`,
                ];
                for (const query of searchQueries) {
                    const response = await fetch(
                        `/.netlify/functions/reddit?query=${query}`
                    );
                    const json = await response.json();

                    for (const child of json.data.children) {
                        // If the link is not already in the list (from searching by new)
                        if (
                            filterLinks(child.data, match) &&
                            !newLinks.some((link) => link.url === child.data.url)
                        ) {
                            newLinks.push({
                                title: child.data.title,
                                url: child.data.url,
                                permalink: child.data.permalink,
                                created: child.data.created,
                            });
                        }
                    }
                }
            }

            setLinks(sortLinks(newLinks));
        } catch (e) {
            console.error(e);
            displayError();
        } finally {
            setLoadingLinks(false);
        }
    };

    return { links, loadingLinks, loadLinks };
};
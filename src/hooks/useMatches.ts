import { useEffect, useState } from "react";
import { LeagueData } from "types";
import { LEAGUE_IDS } from "constants/leagues";
import { formatDate } from "utils/date";
import { fetchMatches, fetchMatchesFallback } from "services/fotmobService";

export const useMatches = (displayError: () => void) => {
    const [leagues, setLeagues] = useState<LeagueData[]>([]);
    const [loadedLinks, setLoadedLinks] = useState(false);

    useEffect(() => {
        const date = formatDate(new Date());
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        (async () => {
            try {
                const json = await fetchMatches(date, timezone);
                setLeagues(
                    json.leagues.filter((league: LeagueData) =>
                        LEAGUE_IDS.includes(league.primaryId)
                    )
                );
                setLoadedLinks(true);
            } catch (e) {
                console.error(e);
                console.error(
                    'Error fetching matches, falling back to most recent matches data.'
                );
                try {
                    const fallbackJson = await fetchMatchesFallback();
                    setLeagues(
                        fallbackJson.leagues.filter((league: LeagueData) =>
                            LEAGUE_IDS.includes(league.primaryId)
                        )
                    );
                    setLoadedLinks(true);
                } catch (e) {
                    console.error(e);
                    console.error('Error fetching fallback matches data.');
                    displayError();
                }
            }
        })();
    }, [displayError]);

    return { leagues, loadedLinks };
};
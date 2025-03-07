import { useState, useEffect } from 'react';
import { Match } from 'components';
import './Matches.css';

interface MatchesProps {
  dark: boolean;
  displayError: () => void;
}

interface Team {
  id: number;
  name: string;
  longName: string;
  score?: number;
}

interface Match {
  id: number;
  home: Team;
  away: Team;
  status: {
    utcTime: string;
    started: boolean;
    finished: boolean;
  };
}

interface League {
  primaryId: number;
  name: string;
  matches: Match[];
}

const formatDate = (date: Date): String => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}${month}${day}`;
};

const leagueIDs = [
  42, 44, 47, 50, 53, 54, 55, 73, 74, 77, 87, 132, 133, 134, 138, 139, 141, 207,
  209, 222, 247, 289, 290, 8924, 9806, 9807, 9808, 9809, 10197, 10199, 10216,
];
const date = formatDate(new Date());

const Matches = ({ dark, displayError }: MatchesProps) => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loadedLinks, setLoadedLinks] = useState(false);

  useEffect(() => {
    const fetchMatches = async (link: string) => {
      const response = await fetch(link);
      const json = await response.json();
      setLeagues(
        json.leagues.filter((league: League) =>
          leagueIDs.includes(league.primaryId)
        )
      );
      setLoadedLinks(true);
    };

    (async () => {
      try {
        await fetchMatches(`/.netlify/functions/matches?date=${date}`);
      } catch (e) {
        console.error(e);
        console.error(
          'Error fetching matches, falling back to most recent matches data.'
        );
        try {
          await fetchMatches('/.netlify/functions/matchesFallback');
        } catch (e) {
          console.error(e);
          console.error('Error fetching fallback matches data.');
          displayError();
        }
      }
    })();
  }, []);

  return (
    <div>
      {leagues.length > 0 ? (
        leagues.map((league) => (
          <div className="leagueContainer" key={league.primaryId}>
            <div className="league">
              <img
                src={`https://images.fotmob.com/image_resources/logo/leaguelogo/${
                  dark ? 'dark/' : ''
                }${league.primaryId}.png`}
                alt={`${league.name} Logo`}
              />
              <h2>{league.name}</h2>
            </div>
            {league.matches.map((match) => (
              <Match match={match} displayError={displayError} key={match.id} />
            ))}
          </div>
        ))
      ) : !loadedLinks ? (
        <p>Loading leagues and matches...</p>
      ) : (
        <p>No matches available</p>
      )}
    </div>
  );
};

export default Matches;

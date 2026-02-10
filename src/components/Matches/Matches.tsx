import { Match } from 'components';
import { useMatches } from 'hooks/useMatches';
import './Matches.css';

interface MatchesProps {
  dark: boolean;
  displayError: () => void;
}

const Matches = ({ dark, displayError }: MatchesProps) => {
  const { leagues, loadedLinks } = useMatches(displayError);

  return (
    <div>
      {leagues.length > 0 ? (
        leagues.map((league) => (
          <div className="leagueContainer" key={league.primaryId + league.name}>
            <div className="league">
              <img
                src={`https://images.fotmob.com/image_resources/logo/leaguelogo/${dark ? 'dark/' : ''
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

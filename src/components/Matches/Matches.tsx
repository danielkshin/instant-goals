import { useCallback, useEffect, useState } from 'react';
import { Match } from 'components';
import { useMatches } from 'hooks/useMatches';
import LastUpdated from './LastUpdated';
import './Matches.css';

interface MatchesProps {
  dark: boolean;
  displayError: () => void;
}

const Matches = ({ dark, displayError }: MatchesProps) => {
  const { leagues, loadedLinks, cachedAt } = useMatches(displayError);
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const showLinksError = useCallback((message: string) => setToast({ message }), []);

  useEffect(() => {
    if (!toast) return;
    setToastVisible(true);
    const fadeTimeout = window.setTimeout(() => setToastVisible(false), 2500);
    const clearTimeout = window.setTimeout(() => setToast(null), 2750);
    return () => {
      window.clearTimeout(fadeTimeout);
      window.clearTimeout(clearTimeout);
    };
  }, [toast]);

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
              <Match match={match} onLinksError={showLinksError} key={match.id} />
            ))}
          </div>
        ))
      ) : !loadedLinks ? (
        <p>Loading leagues and matches...</p>
      ) : (
        <p>No matches available</p>
      )}
      {cachedAt && <LastUpdated timestamp={cachedAt} />}
      <div className={`linksToast${toastVisible ? ' visible' : ''}`} role="status" aria-live="polite" aria-atomic="true">
        {toast?.message}
      </div>
    </div>
  );
};

export default Matches;

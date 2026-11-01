import { useEffect, useState } from 'react';
import { Links } from 'components';
import { TbReload } from 'react-icons/tb';
import { useLinks } from 'hooks/useLinks';
import { MatchData } from 'types';
import './Match.css';

interface MatchProps {
  match: MatchData;
  onLinksError: (message: string) => void;
}

const Match = ({ match, onLinksError }: MatchProps) => {
  const [show, setShow] = useState(false);
  const { links, loadingLinks, linksError, loadLinks } = useLinks(match);

  useEffect(() => {
    if (linksError) onLinksError(linksError);
  }, [linksError, onLinksError]);

  const { home, away } = match;

  const showLinks = (): void => {
    if (!show) {
      loadLinks();
    }
    setShow((show) => !show);
  };

  return (
    <div>
      <div
        onClick={() => showLinks()}
        className={!show ? 'match' : 'match active'}
      >
        <img
          src={`https://images.fotmob.com/image_resources/logo/teamlogo/${home.id}.png`}
          alt={`${home.name} Logo`}
        />
        <span className="home">{home.name}</span>
        {match.status.started ? (
          <span className="score">
            <span>{home.score}</span>
            <span>-</span>
            <span>{away.score}</span>
          </span>
        ) : (
          <span>v</span>
        )}
        <span className="away">{away.name}</span>
        <img
          src={`https://images.fotmob.com/image_resources/logo/teamlogo/${away.id}.png`}
          alt={`${away.name} Logo`}
        />
      </div>
      <div className={!show ? 'links' : 'links active'}>
        <button type="button" onClick={loadLinks} className="reload" disabled={loadingLinks}>
          {loadingLinks ? 'Loading links...' : 'Reload Links'}
          {!loadingLinks && <TbReload size={20} />}
        </button>
        {(links.length > 0 || !loadingLinks) && (
          <Links links={links} />
        )}
      </div>
    </div>
  );
};

export default Match;

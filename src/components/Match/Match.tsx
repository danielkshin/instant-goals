import { useState } from 'react';
import { Links } from 'components';
import { TbReload } from 'react-icons/tb';
import { useLinks } from 'hooks/useLinks';
import { MatchData } from 'types';
import './Match.css';

interface MatchProps {
  match: MatchData;
  displayError: () => void;
}

const Match = ({ match, displayError }: MatchProps) => {
  const [show, setShow] = useState(false);
  const { links, loadingLinks, loadLinks } = useLinks(match, displayError);

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
        {!loadingLinks ? (
          <>
            <p onClick={loadLinks} className="link">
              Reload Links
              <TbReload size={20} />
            </p>
            <Links links={links} />
          </>
        ) : (
          <p>Loading links...</p>
        )}
      </div>
    </div>
  );
};

export default Match;

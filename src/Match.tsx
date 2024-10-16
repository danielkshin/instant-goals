import { useState } from 'react';
import Links from './Links';
import './Match.css';
import reload from './assets/reload.png';

interface MatchProps {
  match: MatchData;
  setError: (error: boolean) => void;
}

interface MatchData {
  home: Team;
  away: Team;
  status: {
    utcTime: string;
    started: boolean;
    finished: boolean;
  };
}

interface Team {
  id: number;
  name: string;
  longName: string;
  score?: number;
}

interface Link {
  title: string;
  url: string;
  created: number;
}

const Match = (props: MatchProps) => {
  const [links, setLinks] = useState<Link[]>([]);
  const [show, setShow] = useState<boolean>(false);
  const [loadingLinks, setLoadingLinks] = useState<boolean>(false);

  const match = props.match;
  const home = match.home;
  const away = match.away;

  const filterLinks = (data: any): boolean => {
    return (
      // exclude U19, U21, and women's teams
      !(
        data.title.includes('U19') ||
        data.title.includes('U21') ||
        data.title.includes(' W ')
      ) &&
      // check link
      (data.url.includes('/v/') ||
        data.url.includes('/c/') ||
        data.url.includes('v.redd.it') ||
        data.url.includes('goal')) &&
      // no crossposts
      !data.hasOwnProperty('crosspost_parent') &&
      // posted during or after the game
      data.created * 1000 > Date.parse(match.status.utcTime)
    );
  };

  const loadLinks = async (): Promise<void> => {
    setLoadingLinks(true);
    setLinks([]);

    let newLinks: Link[] = [];

    // Search r/soccer by new (instant updates) during the game
    if (match.status.started && !match.status.finished) {
      const teamNames = new Set([
        home.name,
        away.name,
        home.longName,
        away.longName,
        ...home.name.split(' '),
        ...away.name.split(' '),
        ...home.longName.split(' '),
        ...away.longName.split(' '),
      ]);
      const response = await fetch('https://old.reddit.com/r/soccer/new.json');
      const json = await response.json();
      for (const child of json.data.children) {
        if (filterLinks(child.data)) {
          if ([...teamNames].some((name) => child.data.title.includes(name))) {
            newLinks.push({
              title: child.data.title,
              url: child.data.url,
              created: child.data.created,
            });
          }
        }
      }
    }

    // Search r/soccer by Reddit's search API (delayed updates) after the game
    if (match.status.started || match.status.finished) {
      const searchQueries = [
        `"${home.name}"OR"${home.longName}"`,
        `"${away.name}"OR"${away.longName}"`,
      ];
      for (const query of searchQueries) {
        const response = await fetch(
          `https://old.reddit.com/r/soccer/search.json?q=${query}&type=link&sort=new&t=day&restrict_sr=on`
        );
        const json = await response.json();

        for (const child of json.data.children) {
          if (filterLinks(child.data)) {
            if (!newLinks.some((link) => link.url === child.data.url)) {
              newLinks.push({
                title: child.data.title,
                url: child.data.url,
                created: child.data.created,
              });
            }
          }
        }
      }
    }

    newLinks.sort((a, b) => {
      return a.created - b.created;
    });
    setLinks(newLinks);
    setLoadingLinks(false);
  };

  const showLinks = (): void => {
    if (!show) {
      loadLinks().catch((e) => {
        console.error(e);
        props.setError(true);
      });
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
              Reload links
              <img src={reload} alt="Reload icon" />
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

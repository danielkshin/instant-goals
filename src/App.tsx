import { useState, useEffect } from 'react';
import './App.css';
import Header from './Header';
import Match from './Match';
import Error from './Error';
import Footer from './Footer';
import theme from './assets/theme.png';

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

const App = () => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [error, setError] = useState<boolean>(false);
  const [dark, setDark] = useState<boolean>(
    localStorage.getItem('dark') === 'true'
  );

  const formatDate = (date: Date): String => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
  };

  useEffect(() => {
    const leagueIDs = [
      42, 44, 47, 50, 53, 54, 55, 73, 74, 77, 87, 132, 133, 134, 138, 139, 141,
      207, 209, 222, 247, 289, 290, 8924, 9806, 9807, 9808, 9809, 10197, 10199,
      10216,
    ];
    const date = formatDate(new Date());
    const fetchLeagues = async () => {
      try {
        const response = await fetch(
          `/.netlify/functions/matches?date=${date}`
        );
        const json = await response.json();
        setLeagues(
          json.leagues.filter((league: League) =>
            leagueIDs.includes(league.primaryId)
          )
        );
      } catch (e) {
        console.error(e);
        setError(true);
      }
    };

    fetchLeagues();
  }, []);

  const changeTheme = () => {
    localStorage.setItem('dark', (!dark).toString());
    setDark(!dark);
  };

  if (error) return <Error />;
  return (
    <div className={`App${dark ? ' dark' : ''}`}>
      <Header />
      <div className="theme">
        <img src={theme} alt="Theme icon" onClick={changeTheme} />
      </div>
      {leagues.map((league) => (
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
            <Match match={match} setError={setError} key={match.id} />
          ))}
        </div>
      ))}
      <Footer />
    </div>
  );
};

export default App;

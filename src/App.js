import "./App.css";
import Match from "./Match.js";
import { useState, useEffect } from "react";

function App() {
  const [leagues, setLeagues] = useState([]);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}${month}${day}`;
  };

  useEffect(() => {
    const date = formatDate(new Date());
    const fetchLeagues = async () => {
      const response = await fetch(`/.netlify/functions/matches?date=${date}`);
      const json = await response.json();
      setLeagues(json.leagues.filter((a) => [47, 53, 54, 87].includes(a.id)));
    };

    fetchLeagues().catch(console.warn);
  }, []);

  return (
    <div className="App">
      {leagues.map((league) => (
        <div className="leagueContainer">
          <div className="league" key={league.id}>
            <img
              src={`https://images.fotmob.com/image_resources/logo/leaguelogo/${league.id}.png`}
              alt={`${league.name} Logo`}
            />
            <h2>{league.name}</h2>
          </div>
          {league.matches.map((match) => (
            <Match match={match} key={match.id} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default App;

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
    const leagueIDs = [
      42, 44, 47, 48, 50, 53, 54, 55, 73, 74, 77, 87, 130, 132, 133, 134, 138,
      139, 141, 207, 209, 222, 247, 289, 290, 8924, 9806, 9807, 9808, 9809,
      10216, 10199, 10195, 10197,
    ];
    const date = formatDate(new Date());
    const fetchLeagues = async () => {
      const response = await fetch(`/.netlify/functions/matches?date=${date}`);
      const json = await response.json();
      setLeagues(
        json.leagues.filter((league) => leagueIDs.includes(league.primaryId))
      );
    };

    fetchLeagues().catch(console.warn);
  }, []);

  return (
    <div className="App">
      {leagues.map((league) => (
        <div className="leagueContainer" key={league.primaryId}>
          <div className="league">
            <img
              src={`https://images.fotmob.com/image_resources/logo/leaguelogo/${league.primaryId}.png`}
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

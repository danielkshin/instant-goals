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
        <div key={league.id}>
          <h1 key={league.name}>{league.name}</h1>
          {league.matches.map((match) => (
            <Match match={match} key={match.id} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default App;

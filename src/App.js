import "./App.css";
import { useState, useEffect } from "react";

function App() {
  const [leagues, setLeagues] = useState([]);
  const [links, setLinks] = useState({});

  useEffect(() => {
    const fetchLeagues = async () => {
      const response = await fetch(
        "https://corsproxy.io/?https://www.fotmob.com/api/matches?date=20240915"
      ); // temp solution
      const json = await response.json();
      setLeagues(json.leagues.filter((a) => [47, 53, 54, 87].includes(a.id)));
    };

    fetchLeagues().catch(console.warn);
  }, []);

  const onAddLinks = async (team1, team2, id) => {
    let newLinks = [];
    let response;
    try {
      response = await fetch(
        `https://www.reddit.com/r/soccer/search.json?q=(${team1.name}) OR (${team2.name}) OR (${team1.longName}) OR (${team2.longName})&f=flair_name%3A"Media"&restrict_sr=on&sort=new&limit=50`
      );
    } catch (e) {
      console.log(e);
    }
    let json = await response.json();
    for (let child of json.data.children) {
      if (
        // child.data.title.includes("[") &&
        // child.data.title.includes("]") &&
        // child.data.title.includes("-") &&
        // child.data.title.includes("'") &&
        (child.data.url.includes("/v/") ||
          child.data.url.includes("/c/") ||
          child.data.url.includes("v.redd.it") ||
          child.data.url.includes("goal")) &&
        new Date(child.data.created * 1000).toDateString() ===
          new Date().toDateString()
      ) {
        newLinks.push({
          title: child.data.title,
          url: child.data.url,
          created: child.data.created,
        });
      }
    }
    if (newLinks.length > 0) {
      newLinks.reverse();
      setLinks({ [id]: newLinks, ...links });
    }
  };

  return (
    <div className="App">
      {leagues.map((league) => (
        <div>
          <h1>{league.name}</h1>
          {league.matches.map((match) => (
            <div>
              <p onClick={() => onAddLinks(match.home, match.away, match.id)}>
                <b>
                  {match.home.name}{" "}
                  {match.status.scoreStr === undefined
                    ? " v "
                    : match.status.scoreStr}{" "}
                  {match.away.name}
                </b>
              </p>
              {links.hasOwnProperty(match.id)
                ? links[match.id].map((link) => (
                    <div>
                      <a href={link.url} target="_blank" rel="noreferrer">
                        {link.title}
                      </a>
                    </div>
                  ))
                : ""}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default App;

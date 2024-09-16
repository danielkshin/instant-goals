import { useState } from "react";
export default function Match(props) {
  const [links, setLinks] = useState({});

  const match = props.match;

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
        // check link
        (child.data.url.includes("/v/") ||
          child.data.url.includes("/c/") ||
          child.data.url.includes("v.redd.it") ||
          child.data.url.includes("goal")) &&
        // no crossposts
        !child.data.hasOwnProperty("crosspost_parent") &&
        // posted on current date
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
    <div>
      <p onClick={() => onAddLinks(match.home, match.away, match.id)}>
        <b>
          {match.home.name}{" "}
          {match.status.scoreStr === undefined ? " v " : match.status.scoreStr}{" "}
          {match.away.name}
        </b>
      </p>
      {links.hasOwnProperty(match.id)
        ? links[match.id].map((link) => (
            <div key={link.title}>
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                key={link.url}
              >
                {link.title}
              </a>
            </div>
          ))
        : ""}
    </div>
  );
}

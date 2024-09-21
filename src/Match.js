import { useState } from "react";
import Links from "./Links.js";
import "./Match.css";
import reload from "./assets/reload.png";

export default function Match(props) {
  const [links, setLinks] = useState([]);
  const [show, setShow] = useState(false);
  const [loadingLinks, setLoadingLinks] = useState(false);

  const match = props.match;
  const home = match.home;
  const away = match.away;

  const filterLinks = (data) => {
    return (
      // exclude U19 and women's teams
      !(data.title.includes("U19") || data.title.includes(" W ")) &&
      // check link
      (data.url.includes("/v/") ||
        data.url.includes("/c/") ||
        data.url.includes("v.redd.it") ||
        data.url.includes("goal")) &&
      // no crossposts
      !data.hasOwnProperty("crosspost_parent") &&
      // posted on current date
      new Date(data.created * 1000).toDateString() === new Date().toDateString()
    );
  };

  const loadLinks = async () => {
    setLoadingLinks(true);
    setLinks([]);

    let newLinks = [];

    // Search r/soccer by new (instant updates) during the game
    if (
      Date.now() > Date.parse(match.status.utcTime) &&
      Date.now() < Date.parse(match.status.utcTime) + 5400000
    ) {
      const teamNames = new Set([
        home.name,
        away.name,
        home.longName,
        away.longName,
        ...home.name.split(" "),
        ...away.name.split(" "),
        ...home.longName.split(" "),
        ...away.longName.split(" "),
      ]);
      const response = await fetch("https://old.reddit.com/r/soccer/new.json");
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
    if (Date.now() > Date.parse(match.status.utcTime)) {
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

  const showLinks = () => {
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
        className={!show ? "match" : "match active"}
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
      <div className={!show ? "links" : "links active"}>
        {!loadingLinks ? (
          <>
            <p onClick={loadLinks} className="link">
              Reload links
              <img src={reload} alt="Reload icon" />
            </p>
            <Links links={links} loadLinks={loadLinks} />
          </>
        ) : (
          <p>Loading links...</p>
        )}
      </div>
    </div>
  );
}

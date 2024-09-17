import { useState } from "react";
import Links from "./Links.js";
import "./Match.css";

export default function Match(props) {
  const [links, setLinks] = useState([]);
  const [show, setShow] = useState(false);
  const [loadingLinks, setLoadingLinks] = useState(false);

  const match = props.match;
  const home = match.home;
  const away = match.away;

  const filterLinks = (data) => {
    return (
      // exclude U19
      !data.title.includes("U19") &&
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
    const searchQueries = new Set([
      home.name,
      away.name,
      home.longName,
      away.longName,
    ]);

    for (const query of searchQueries) {
      const response = await fetch(
        `https://www.reddit.com/r/soccer/search.json?q=${query}&type=link&sort=new&t=day&restrict_sr=on`
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
    newLinks.reverse();
    setLinks(newLinks);
    setLoadingLinks(false);
  };

  const showLinks = () => {
    if (!show) {
      loadLinks().catch(console.warn);
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
        <span className="score">
          <span>{home.score}</span>
          <span>-</span>
          <span>{away.score}</span>
        </span>
        <span className="away">{away.name}</span>
        <img
          src={`https://images.fotmob.com/image_resources/logo/teamlogo/${away.id}.png`}
          alt={`${away.name} Logo`}
        />
      </div>
      <div className={!show ? "links" : "links active"}>
        {!loadingLinks ? <Links links={links} /> : <p>Loading...</p>}
      </div>
    </div>
  );
}

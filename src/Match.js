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

  const loadLinks = async () => {
    setLoadingLinks(true);
    setLinks([]);
    let newLinks = [];
    let response;
    try {
      response = await fetch(
        `https://www.reddit.com/r/soccer/search.json?q=(${home.name}) OR (${away.name}) OR (${home.longName}) OR (${away.longName})&f=flair_name%3A"Media"&restrict_sr=on&sort=new&limit=50`
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
    newLinks.reverse();
    setLinks(newLinks);
    setLoadingLinks(false);
  };

  const showLinks = () => {
    if (!show) {
      loadLinks();
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

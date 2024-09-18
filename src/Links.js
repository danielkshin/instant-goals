import "./Match.css";

export default function Links(props) {
  const links = props.links;
  if (links.length > 0) {
    return links.map((link) => (
      <a
        href={link.url}
        target="_blank"
        rel="noreferrer"
        className="link"
        key={link.url}
      >
        {link.title}
      </a>
    ));
  } else {
    return <p>Links not found</p>;
  }
}

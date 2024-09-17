export default function Links(props) {
  const links = props.links;
  if (links.length > 0) {
    return links.map((link) => (
      <div key={link.url}>
        <a href={link.url} target="_blank" rel="noreferrer">
          {link.title}
        </a>
      </div>
    ));
  } else {
    return (
      <div>
        <p>None found</p>
      </div>
    );
  }
}

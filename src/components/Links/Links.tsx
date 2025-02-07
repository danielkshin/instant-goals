import { FaComment } from 'react-icons/fa';
import './Links.css';

interface Link {
  title: string;
  url: string;
  permalink: string;
}

interface LinksProps {
  links: Link[];
}

const Links = (props: LinksProps) => {
  const links = props.links;
  if (links.length > 0) {
    return links.map((link) => (
      <div className="linkRow">
        <a
          href={link.url}
          target="_blank"
          rel="noreferrer"
          className="link"
          key={link.url}
        >
          {link.title}
        </a>
        <a
          href={'https://www.reddit.com' + link.permalink}
          target="_blank"
          rel="noreferrer"
          className="comments"
          key={link.permalink}
        >
          <FaComment size={16} />
        </a>
      </div>
    ));
  } else {
    return <p>Links not found</p>;
  }
};

export default Links;

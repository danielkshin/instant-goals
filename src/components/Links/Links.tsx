import { LinkData } from 'types';
import { FaComment } from 'react-icons/fa';
import './Links.css';

interface LinksProps {
  links: LinkData[];
}

const Links = (props: LinksProps) => {
  const links = props.links;
  if (links.length > 0) {
    return links.map((link) => (
      <div className="linkRow" key={link.url}>
        <a
          href={link.url}
          target="_blank"
          rel="noreferrer"
          className="link"
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

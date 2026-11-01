import { useRef, useState } from 'react';
import { LinkData, MatchData } from 'types';
import { loadMatchLinks, mergeLinks } from 'services/linkService';

export const useLinks = (match: MatchData) => {
    const [links, setLinks] = useState<LinkData[]>([]);
    const [loadingLinks, setLoadingLinks] = useState(false);
    const [linksError, setLinksError] = useState<string | null>(null);
    const inFlight = useRef(false);

    const loadLinks = async (): Promise<void> => {
        if (inFlight.current) return;
        inFlight.current = true;
        setLoadingLinks(true);
        setLinksError(null);

        try {
            const result = await loadMatchLinks(match);
            setLinks(previous => result.failures ? mergeLinks(previous, result.links) : result.links);
            if (result.failures) {
                setLinksError(result.failures === result.requestCount
                    ? 'Could not refresh links. Please retry.'
                    : 'Some links could not be loaded. Please retry.');
            }
        } catch (error) {
            console.error(error);
            setLinksError('Could not refresh links. Please retry.');
        } finally {
            inFlight.current = false;
            setLoadingLinks(false);
        }
    };

    return { links, loadingLinks, linksError, loadLinks };
};

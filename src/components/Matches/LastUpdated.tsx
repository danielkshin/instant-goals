import { useEffect, useState } from 'react';

const relativeTime = new Intl.RelativeTimeFormat('en', { numeric: 'always' });

const LastUpdated = ({ timestamp }: { timestamp: string }) => {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const updateTime = () => setNow(Date.now());
    updateTime();
    const interval = window.setInterval(updateTime, 60_000);
    window.addEventListener('focus', updateTime);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', updateTime);
    };
  }, [timestamp]);

  const updatedAt = new Date(timestamp);
  const minutes = Math.max(0, Math.floor((now - updatedAt.getTime()) / 60_000));
  const label = minutes < 1
    ? 'just now'
    : minutes < 60
      ? relativeTime.format(-minutes, 'minute')
      : minutes < 1440
        ? relativeTime.format(-Math.floor(minutes / 60), 'hour')
        : relativeTime.format(-Math.floor(minutes / 1440), 'day');

  return (
    <p className="lastUpdated">
      Match scores updated{' '}
      <time dateTime={timestamp} title={updatedAt.toLocaleString()}>
        {label}
      </time>
    </p>
  );
};

export default LastUpdated;

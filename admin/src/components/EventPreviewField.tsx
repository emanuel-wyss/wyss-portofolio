'use client';

import { useState } from 'react';

const events = [
  ['halloween', 'Halloween — bats'],
  ['christmas', 'Christmas — interactive snow'],
  ['newyear', 'New Year — fireworks'],
  ['valentines', 'Valentine’s — cursor hearts'],
  ['easter', 'Easter — egg burst'],
  ['pride', 'Pride — rainbow confetti'],
  ['swiss', 'Swiss National Day — cross fireworks'],
  ['aprilfools', 'April Fools — pixel glitch'],
] as const;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://wyss.rocks';

export function EventPreviewField() {
  const [event, setEvent] = useState(events[0][0]);
  const href = `${SITE_URL}/?event=${encodeURIComponent(event)}`;

  return (
    <div style={{ marginBlock: '1.5rem', padding: '1rem', border: '1px solid var(--theme-elevation-150)', borderRadius: 6 }}>
      <h3 style={{ margin: '0 0 .35rem' }}>Event preview</h3>
      <p style={{ margin: '0 0 1rem', color: 'var(--theme-elevation-600)' }}>
        Admin-only shortcut. Select an event and open the homepage in preview mode.
      </p>
      <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={event}
          onChange={(e) => setEvent(e.target.value as typeof event)}
          aria-label="Event to preview"
          style={{ minWidth: 250, padding: '.65rem' }}
        >
          {events.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <a className="btn btn--style-primary btn--size-medium" href={href} target="_blank" rel="noreferrer">
          Preview on homepage ↗
        </a>
      </div>
    </div>
  );
}

export default EventPreviewField;

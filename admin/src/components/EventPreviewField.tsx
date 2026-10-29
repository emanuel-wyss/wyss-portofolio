'use client';

import { useEffect, useRef, useState } from 'react';

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
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    frameRef.current?.contentWindow?.postMessage({ type: 'wyss-event-preview', event }, SITE_URL);
  }, [event]);

  const sendPreview = () => {
    frameRef.current?.contentWindow?.postMessage({ type: 'wyss-event-preview', event }, SITE_URL);
  };

  return (
    <div style={{ marginBlock: '1.5rem', padding: '1rem', border: '1px solid var(--theme-elevation-150)', borderRadius: 6 }}>
      <h3 style={{ margin: '0 0 .35rem' }}>Event preview</h3>
      <p style={{ margin: '0 0 1rem', color: 'var(--theme-elevation-600)' }}>
        Preview events securely inside the admin. Nothing is written to the public URL or visitor preferences.
      </p>
      <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <select
          value={event}
          onChange={(e) => setEvent(e.target.value as typeof event)}
          aria-label="Event to preview"
          style={{ minWidth: 250, padding: '.65rem' }}
        >
          {events.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <button type="button" className="btn btn--style-primary btn--size-medium" onClick={sendPreview}>
          Apply preview
        </button>
      </div>
      <iframe
        ref={frameRef}
        title="Homepage event preview"
        src={SITE_URL}
        onLoad={sendPreview}
        style={{ width: '100%', minHeight: 560, border: '1px solid var(--theme-elevation-150)', borderRadius: 4, background: '#111' }}
      />
    </div>
  );
}

export default EventPreviewField;

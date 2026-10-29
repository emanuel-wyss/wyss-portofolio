'use client';

import { useEffect, useRef, useState } from 'react';

const events = [
  ['halloween', 'Halloween — moon, ghost trail & boss bat'],
  ['christmas', 'Christmas — snowbank accumulation & wind'],
  ['newyear', 'New Year — rockets & WYSS skywriting'],
  ['valentines', 'Valentine’s — heart constellation web'],
  ['easter', 'Easter — hidden egg hunt & bunny'],
  ['pride', 'Pride — flowing rainbow ribbon painter'],
  ['swiss', 'Swiss National Day — Alpine bonfires & cross rockets'],
  ['aprilfools', 'April Fools — runaway button & kernel panic'],
] as const;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://wyss.rocks';

export function EventPreviewField() {
  const [event, setEvent] = useState(events[0][0]);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const previewUrl = `${SITE_URL}/#preview-event=${encodeURIComponent(event)}`;

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
        Preview events inline or open a fullscreen preview tab. Uses a client-only URL hash (`#preview-event=...`).
      </p>
      <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <select
          value={event}
          onChange={(e) => setEvent(e.target.value as typeof event)}
          aria-label="Event to preview"
          style={{ minWidth: 260, padding: '.65rem' }}
        >
          {events.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn--style-secondary btn--size-medium" onClick={sendPreview}>
          Apply inline
        </button>
        <a
          className="btn btn--style-primary btn--size-medium"
          href={previewUrl}
          target="_blank"
          rel="noreferrer"
        >
          Open Preview in New Tab ↗
        </a>
      </div>
      <iframe
        key={event}
        ref={frameRef}
        title="Homepage event preview"
        src={previewUrl}
        onLoad={sendPreview}
        style={{ width: '100%', minHeight: 540, border: '1px solid var(--theme-elevation-150)', borderRadius: 4, background: '#111' }}
      />
    </div>
  );
}

export default EventPreviewField;

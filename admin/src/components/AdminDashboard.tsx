'use client';

import { useEffect, useRef, useState } from 'react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://wyss.rocks';
const GITHUB_URL = 'https://github.com/emanuel-wyss/wyss-portofolio';
const CODEBERG_URL = 'https://codeberg.org/maenu/wyss-portofolio';

export const EVENT_CATALOG = [
  {
    id: 'halloween',
    name: 'Halloween',
    window: 'Oct 28 – Oct 31',
    interaction: 'Full moon, ghost trail & Boss Bat (click 3 bats)',
  },
  {
    id: 'christmas',
    name: 'Christmas',
    window: 'Dec 22 – Dec 28',
    interaction: 'Settling snowbank, cursor wind & snow-globe shake',
  },
  {
    id: 'newyear',
    name: 'New Year',
    window: 'Dec 29 – Jan 3',
    interaction: 'Rising rockets & every 4th launch skywrites "WYSS"',
  },
  {
    id: 'valentines',
    name: 'Valentine’s Day',
    window: 'Feb 11 – Feb 14',
    interaction: 'Floating heart constellation web & magnetic pulse',
  },
  {
    id: 'easter',
    name: 'Easter',
    window: 'Good Friday – Easter Monday (dynamic)',
    interaction: '6 hidden pastel eggs around edges + hopping bunny',
  },
  {
    id: 'pride',
    name: 'Pride Month',
    window: 'June 1 – June 30',
    interaction: '6-band flowing rainbow ribbon painter & prism wave',
  },
  {
    id: 'swiss',
    name: 'Swiss National Day',
    window: 'Jul 29 – Aug 1',
    interaction: 'Alpine peaks, Höhenfeuer bonfires & Swiss cross rockets',
  },
  {
    id: 'aprilfools',
    name: 'April Fools',
    window: 'Apr 1 (no lead-in)',
    interaction: 'Runaway [ FIX BUG ] button, kernel panic popups & RGB tear',
  },
] as const;

type SystemStatus = {
  service?: string;
  status?: string;
  environment?: string;
  commit?: string | null;
  timestamp?: string;
};

type WeatherNow = {
  weather?: string;
  temperatureC?: number | null;
  description?: string;
  location?: string;
};

export function AdminDashboard() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [online, setOnline] = useState<boolean | null>(null);
  const [weather, setWeather] = useState<WeatherNow | null>(null);
  const [activeEvent, setActiveEvent] = useState<string>(EVENT_CATALOG[0].id);
  const [showIframe, setShowIframe] = useState<boolean>(true);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    fetch(`${SITE_URL}/api/system-status`)
      .then(async (res) => {
        setOnline(res.ok);
        if (res.ok) setStatus(await res.json());
      })
      .catch(() => setOnline(false));

    fetch(`${SITE_URL}/api/weather`)
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        setWeather(data.weather || null);
      })
      .catch(() => null);
  }, []);

  const sendPreviewToIframe = (ev = activeEvent) => {
    frameRef.current?.contentWindow?.postMessage({ type: 'wyss-event-preview', event: ev }, SITE_URL);
  };

  useEffect(() => {
    sendPreviewToIframe(activeEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEvent]);

  const previewUrlFor = (ev: string) => `${SITE_URL}/#preview-event=${encodeURIComponent(ev)}`;

  return (
    <section
      style={{
        marginBottom: '2.5rem',
        padding: '1.5rem',
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: 8,
        background: 'var(--theme-elevation-50)',
      }}
    >
      {/* Header + Quick Links */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: '1.25rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--theme-elevation-150)',
        }}
      >
        <div>
          <div style={{ fontSize: 11, fontFamily: 'monospace', opacity: 0.7, letterSpacing: '0.08em' }}>
            WYSS.ROCKS // COMMAND CENTER
          </div>
          <h2 style={{ margin: '0.2rem 0 0.35rem', fontSize: '1.5rem' }}>System &amp; Content Dashboard</h2>
          <p style={{ margin: 0, color: 'var(--theme-elevation-600)', fontSize: 13 }}>
            Manage site globals, collections, deployment health, and seasonal interactive scenes.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <a className="btn btn--style-primary btn--size-small" href="/admin/globals/site-config">
            ⚙ Site Config (Global)
          </a>
          <a className="btn btn--style-secondary btn--size-small" href="/admin/collections/posts/create">
            + Post
          </a>
          <a className="btn btn--style-secondary btn--size-small" href="/admin/collections/snippets/create">
            + Snippet
          </a>
          <a className="btn btn--style-secondary btn--size-small" href="/admin/collections/gallery/create">
            + Album
          </a>
          <a className="btn btn--style-secondary btn--size-small" href={SITE_URL} target="_blank" rel="noreferrer">
            Live Site ↗
          </a>
        </div>
      </div>

      {/* Telemetry Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.5rem',
        }}
      >
        <TelemetryTile
          label="WEB SERVICE"
          value={online === null ? 'checking…' : online ? 'ONLINE (200)' : 'OFFLINE'}
          accent={online === true ? '#39a852' : online === false ? '#e5484d' : undefined}
          sub={`${SITE_URL}/health`}
          href={`${SITE_URL}/health`}
        />
        <TelemetryTile
          label="WEATHER FEED"
          value={
            weather
              ? `${weather.weather || '—'}${weather.temperatureC != null ? ` · ${weather.temperatureC}°C` : ''}`
              : 'loading…'
          }
          sub={weather?.location || 'Bern, Schweiz'}
        />
        <TelemetryTile
          label="DEPLOYMENT"
          value={status?.commit ? `commit ${status.commit.slice(0, 8)}` : status?.environment || 'production'}
          sub="Codeberg → GitHub → Railway"
          href={GITHUB_URL}
        />
        <TelemetryTile
          label="SOURCE REPOS"
          value="Codeberg & GitHub"
          sub="Open canonical source ↗"
          href={CODEBERG_URL}
        />
      </div>

      {/* Event Preview Studio & Direct Preview Links */}
      <div
        style={{
          padding: '1.1rem',
          border: '1px solid var(--theme-elevation-150)',
          borderRadius: 6,
          background: 'var(--theme-bg)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
            marginBottom: '0.85rem',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Seasonal Event Previews &amp; Direct Links</h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: 12, color: 'var(--theme-elevation-600)' }}>
              Click any event card to preview it inline below, or click <strong>Open Preview ↗</strong> to test full-screen in a new tab.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <a
              className="btn btn--style-primary btn--size-small"
              href={previewUrlFor(activeEvent)}
              target="_blank"
              rel="noreferrer"
            >
              Open &ldquo;{activeEvent}&rdquo; in New Tab ↗
            </a>
            <button
              type="button"
              className="btn btn--style-secondary btn--size-small"
              onClick={() => setShowIframe((v) => !v)}
            >
              {showIframe ? 'Hide Inline Canvas' : 'Show Inline Canvas'}
            </button>
          </div>
        </div>

        {/* Grid of 8 Event Cards with Direct Links */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
            gap: '0.6rem',
            marginBottom: showIframe ? '1rem' : 0,
          }}
        >
          {EVENT_CATALOG.map((item) => {
            const isSelected = activeEvent === item.id;
            return (
              <div
                key={item.id}
                onClick={() => {
                  setActiveEvent(item.id);
                  setShowIframe(true);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveEvent(item.id);
                    setShowIframe(true);
                  }
                }}
                style={{
                  padding: '0.7rem 0.8rem',
                  border: isSelected
                    ? '1.5px solid var(--theme-success-500, #ffd700)'
                    : '1px solid var(--theme-elevation-150)',
                  borderRadius: 6,
                  background: isSelected ? 'var(--theme-elevation-100)' : 'var(--theme-elevation-50)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.45rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                    <strong style={{ fontSize: 13 }}>{item.name}</strong>
                    <span style={{ fontSize: 10, fontFamily: 'monospace', opacity: 0.7 }}>{item.window}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--theme-elevation-600)', marginTop: 4 }}>
                    {item.interaction}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontSize: 10, fontFamily: 'monospace', opacity: isSelected ? 1 : 0.6 }}>
                    {isSelected ? '● ACTIVE IN PREVIEW' : '○ Click to preview'}
                  </span>
                  <a
                    href={previewUrlFor(item.id)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ fontSize: 11, fontFamily: 'monospace', textDecoration: 'underline' }}
                  >
                    Open Preview ↗
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {showIframe ? (
          <iframe
            key={activeEvent}
            ref={frameRef}
            title={`Homepage preview (${activeEvent})`}
            src={previewUrlFor(activeEvent)}
            onLoad={() => sendPreviewToIframe(activeEvent)}
            style={{
              width: '100%',
              minHeight: 520,
              border: '1px solid var(--theme-elevation-200)',
              borderRadius: 6,
              background: '#0a0a08',
            }}
          />
        ) : null}
      </div>
    </section>
  );
}

function TelemetryTile({
  label,
  value,
  sub,
  accent,
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  href?: string;
}) {
  return (
    <div
      style={{
        padding: '0.75rem 0.85rem',
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: 6,
        background: 'var(--theme-bg)',
      }}
    >
      <div style={{ fontSize: 10, fontFamily: 'monospace', opacity: 0.65, letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 600, marginTop: 3, color: accent }}>{value}</div>
      {sub ? (
        href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            style={{ display: 'inline-block', marginTop: 4, fontSize: 11, opacity: 0.75 }}
          >
            {sub}
          </a>
        ) : (
          <div style={{ marginTop: 4, fontSize: 11, opacity: 0.65 }}>{sub}</div>
        )
      ) : null}
    </div>
  );
}

export default AdminDashboard;

import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/privacy')({ component: PrivacyPage });

const processors = [
  {
    id: 'RAILWAY',
    role: 'Hosting & compute',
    location: 'EU West edge (Zürich region) · Railway Corp., USA',
    data: 'IP address, request path, timestamp, user-agent (transient request logs)',
    purpose: 'Run the web server and API; operational debugging via per-request IDs',
    url: 'https://railway.com/legal/privacy',
  },
  {
    id: 'CLOUDFLARE',
    role: 'TLS, CDN & DDoS protection (in front of Railway)',
    location: 'Global edge network · Cloudflare Inc., USA',
    data: 'IP address and connection metadata; network-error reports (NEL) on failed connections only',
    purpose: 'Encrypt traffic, absorb attacks, route requests to the nearest edge',
    url: 'https://www.cloudflare.com/privacypolicy/',
  },
  {
    id: 'CLOUDFLARE_R2',
    role: 'Image & media storage (media.wyss.rocks)',
    location: 'Cloudflare R2 object storage (EU jurisdiction)',
    data: 'IP address when your browser loads an image',
    purpose: 'Serve gallery photos and media files',
    url: 'https://www.cloudflare.com/privacypolicy/',
  },
];

const absent = [
  'Analytics (no Google Analytics, Plausible, Umami, etc.)',
  'Tracking pixels or advertising scripts',
  'Cookies for visitors (zero Set-Cookie headers on all public routes)',
  'Third-party fonts (Monaspace & Silkscreen are self-hosted)',
  'Fingerprinting or cross-site identifiers',
  'Embedded social widgets',
];

const local = [
  ['wyss-color-mode', 'Your light / dark / auto preference'],
  ['wyss-effects-paused', 'Whether background effects are paused'],
  ['wyss-effects-intensity', 'Particle intensity (quiet / standard / party)'],
  ['wyss-event-sound', 'Opt-in interaction sounds'],
  ['wyss-boot-seen', 'Skip the boot animation for this session'],
];

function PrivacyPage() {
  return (
    <section className="privacy-page">
      <div className="container" data-label="// privacy.cfg">
        <header className="page-header">
          <p className="eyebrow">POLICY // DATA_PROCESSING</p>
          <h1>Privacy</h1>
          <p>
            This site is built to collect as little as possible. No tracking, no cookies, no consent
            banner needed. The only parties that see your request are the infrastructure providers
            that physically deliver this page.
          </p>
        </header>

        <div className="privacy-block">
          <h2 className="privacy-h">$ cat ./not-running.log</h2>
          <ul className="privacy-checklist">
            {absent.map((item) => (
              <li key={item}>
                <span className="privacy-ok">[ OFF ]</span> {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="privacy-block">
          <h2 className="privacy-h">$ ls ./processors/</h2>
          <div className="privacy-processors">
            {processors.map((p) => (
              <article className="privacy-card" key={p.id}>
                <header className="privacy-card-head">
                  <span className="privacy-tag">{p.id}</span>
                  <span>{p.role}</span>
                </header>
                <dl>
                  <div><dt>LOCATION</dt><dd>{p.location}</dd></div>
                  <div><dt>DATA</dt><dd>{p.data}</dd></div>
                  <div><dt>PURPOSE</dt><dd>{p.purpose}</dd></div>
                  <div>
                    <dt>POLICY</dt>
                    <dd><a href={p.url} target="_blank" rel="noreferrer">{p.url} ↗</a></dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
          <p className="privacy-note">
            Processing is based on legitimate interest (operating and securing the website). Transfers
            to the USA rely on the providers' standard contractual clauses and the Swiss–US / EU–US Data
            Privacy Framework. Server-side calls to GitHub and Open-Meteo happen on our server — your IP
            is never sent to them.
          </p>
        </div>

        <div className="privacy-block">
          <h2 className="privacy-h">$ cat ./localStorage</h2>
          <p className="privacy-note">
            Purely functional preferences stored only in your own browser. Never transmitted, never
            used for tracking. Clear them anytime via your browser settings.
          </p>
          <ul className="privacy-keys">
            {local.map(([k, v]) => (
              <li key={k}><code>{k}</code><span>{v}</span></li>
            ))}
          </ul>
        </div>

        <div className="privacy-block">
          <h2 className="privacy-h">$ ./contact --rights</h2>
          <p className="privacy-note">
            Under the Swiss revDSG and the EU GDPR you can request access, correction or deletion of
            personal data. Since this site stores no visitor data itself, most requests concern the
            providers above. Questions: <a href="mailto:emanuel@wyss.rocks">emanuel@wyss.rocks</a>
          </p>
          <p className="privacy-updated">LAST_UPDATED: 2026-10-29</p>
        </div>
      </div>
    </section>
  );
}

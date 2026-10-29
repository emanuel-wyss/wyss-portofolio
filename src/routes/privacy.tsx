import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/privacy')({
  head: () => ({
    meta: [{ title: 'wyss: privacy' }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <section className="privacy-page">
      <div className="container" data-label="// privacy.sys">
        <header className="detail-header">
          <h1>Privacy Notice</h1>
          <p className="subtitle">Zero tracking. Zero cookies. Zero third-party telemetry.</p>
        </header>

        <div className="privacy-block">
          <h2 className="privacy-h">1. Data Collection &amp; Cookies</h2>
          <p>
            wyss.rocks does not collect any personal data, does not use tracking cookies, and does not run analytics scripts (no Google Analytics, no telemetry).
          </p>
        </div>

        <div className="privacy-block" style={{ marginTop: '1.5rem' }}>
          <h2 className="privacy-h">2. Typography &amp; Assets</h2>
          <p>
            All fonts (Monaspace Krypton, Argon, Neon, Silkscreen) are 100% self-hosted locally in the bundle. No requests are ever made to Google Fonts or third-party CDNs.
          </p>
        </div>
      </div>
    </section>
  );
}

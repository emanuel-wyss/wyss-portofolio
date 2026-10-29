import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/changelog')({ component: ChangelogPage });

const entries = [
  ['2026-10-29', 'Added nerdy gallery lightbox with EXIF/image metadata inspector, installed sharp, and redesigned startpage'],
  ['2026-10-29', 'Added anonymized private-repo commit & tech-stack aggregation + breakdancing Halloween ghost'],
  ['2026-10-29', 'Upgraded Payload CMS to 3.92.1, Next.js to 16.4.3, React to 19.3.1, and Vite to 8.3.5'],
  ['2026-10-29', 'Added Payload Admin Command Center dashboard with live telemetry & Event Preview Studio'],
  ['2026-10-29', 'Converted Site Config into a single-page Payload Global'],
  ['2026-10-29', 'Added scroll-sensitive parallax motes, live Bern weather particles, and 8 unique seasonal event scenes'],
  ['2026-10-29', 'Redesigned site shell and footer with a concise terminal workstation readout'],
  ['2026-10-29', 'Moved post, snippet, and gallery detail views into the SPA'],
  ['2026-10-28', 'Added GitHub profile showcase, contribution heatmap, and SVG tech radar'],
];

function ChangelogPage() {
  return (
    <section className="changelog-page">
      <div className="container" data-label="// changelog.log">
        <header className="page-header">
          <p className="eyebrow">RELEASE NOTES / SYSTEM HISTORY</p>
          <h1>Changelog</h1>
          <p>Selected changes, experiments, and shipped improvements.</p>
        </header>
        <ol className="changelog-list">
          {entries.map(([date, text]) => (
            <li key={`${date}-${text}`}>
              <time>{date}</time>
              <span>{text}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

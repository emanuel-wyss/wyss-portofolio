import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/changelog')({ component: ChangelogPage });

const entries = [
  ['2026-10-29', 'Replaced event URLs with an embedded admin preview'],
  ['2026-10-29', 'Added interactive event canvas and weather-aware themes'],
  ['2026-10-29', 'Moved detail views into the SPA'],
  ['2026-10-28', 'Added GitHub profile, contribution graph, and tech radar'],
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
          {entries.map(([date, text]) => <li key={`${date}-${text}`}><time>{date}</time><span>{text}</span></li>)}
        </ol>
      </div>
    </section>
  );
}

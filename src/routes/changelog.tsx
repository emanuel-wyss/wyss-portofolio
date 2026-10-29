import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/changelog')({
  head: () => ({
    meta: [{ title: 'wyss: changelog' }],
  }),
  component: ChangelogPage,
});

const CHANGES = [
  {
    date: '2026-03-31',
    title: 'Thematic Weather View Transitions & Modular Styles',
    items: [
      'Added weather-based View Transitions for site content (sun glare, rain wash, cloud roll, blizzard frost, storm flash).',
      'Split monolithic styles.css into modular stylesheets (tokens, base, components, transitions).',
      'Separated site header, content, and footer into distinct view-transition names.',
    ],
  },
  {
    date: '2026-03-30',
    title: 'Self-Hosted Fonts & Privacy Notice',
    items: [
      'Self-hosted Monaspace & Silkscreen fonts, completely dropping Google Fonts requests for 100% zero-tracking compliance.',
      'Added dedicated /privacy notice page detailing zero cookies and zero third-party telemetry.',
    ],
  },
  {
    date: '2026-02-15',
    title: 'Payload CMS 3 & Hono Integration',
    items: [
      'Migrated backend API to Hono with Bun.serve().',
      'Integrated Payload CMS 3 for posts, snippets, and galleries.',
    ],
  },
];

function ChangelogPage() {
  return (
    <section className="detail-page">
      <div className="container" data-label="// changelog.sys">
        <div className="detail-header">
          <h1>Changelog</h1>
          <p className="subtitle">System updates, architectural overhauls, and feature releases.</p>
        </div>

        <ul className="changelog-list">
          {CHANGES.map((entry) => (
            <li key={entry.date}>
              <time>{entry.date}</time>
              <div>
                <h3>{entry.title}</h3>
                <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
                  {entry.items.map((item, idx) => (
                    <li key={idx} style={{ color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

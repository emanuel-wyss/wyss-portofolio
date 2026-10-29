import { createFileRoute, Link } from '@tanstack/react-router';
import { ContentFeed } from '../components/feed/ContentFeed';
import { getSiteConfig } from '../lib/api';

export const Route = createFileRoute('/')({
  loader: async () => {
    const siteConfig = await getSiteConfig();
    return { siteConfig };
  },
  component: HomePage,
});

function HomePage() {
  const { siteConfig } = Route.useLoaderData();

  return (
    <section className="home-workstation">
      <div className="container" data-label="// index.sys">
        <header className="home-terminal-hero">
          <div className="home-hero-meta">
            <span className="home-badge">NODE // WYSS.ROCKS</span>
            <span className="home-coords">LOC: BERN, CH (46.95°N, 7.45°E)</span>
          </div>
          <h1 className="glitch" data-text={siteConfig?.siteName || 'wyss.rocks'}>
            {siteConfig?.siteName || 'wyss.rocks'}
          </h1>
          <p className="home-tagline">
            {siteConfig?.tagline || 'Full-stack developer, designer, and builder'}
          </p>
          {siteConfig?.description ? (
            <p className="home-desc">{siteConfig.description}</p>
          ) : null}
        </header>

        <div className="home-latest-panel">
          <div className="home-latest-head">
            <div>
              <p className="eyebrow">STREAM // RECENT_OUTPUT</p>
              <h2>Latest</h2>
            </div>
            <Link to="/work" className="view-all-inline">
              View All Archive →
            </Link>
          </div>

          <ContentFeed mode="latest" limit={6} initialType="all" />

          <Link to="/work" className="view-all">
            View All →
          </Link>
        </div>
      </div>
    </section>
  );
}

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
    <>
      <section className="hero">
        <div className="container">
          <h1>Welcome to wyss.rocks</h1>
          <p className="tagline">{siteConfig?.tagline || 'Building beautiful, functional web experiences'}</p>
          <div className="cta-buttons">
            <Link to="/about" className="btn btn-primary">
              Learn More
            </Link>
            <Link to="/work" className="btn btn-secondary">
              View My Work
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2>Latest</h2>
          <ContentFeed mode="latest" limit={5} initialType="all" />
          <Link to="/work" className="view-all">
            View All →
          </Link>
        </div>
      </section>
    </>
  );
}

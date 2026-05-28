import { createFileRoute } from '@tanstack/react-router';
import { ContentFeed } from '../components/feed/ContentFeed';

export const Route = createFileRoute('/work')({
  component: WorkPage,
});

function WorkPage() {
  return (
    <section className="work-page">
      <div className="container">
        <h1>Work</h1>
        <p className="subtitle">Posts, snippets, and galleries</p>
        <ContentFeed mode="work" limit={12} initialType="all" />
      </div>
    </section>
  );
}

import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { useState } from 'react';
import { getSnippetBySlug } from '../lib/api';

export const Route = createFileRoute('/snippets/$slug')({
  loader: async ({ params }) => {
    const snippet = await getSnippetBySlug(params.slug);
    if (!snippet) throw notFound();
    return { snippet };
  },
  component: SnippetDetailPage,
});

function formatDate(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function SnippetDetailPage() {
  const { snippet } = Route.useLoaderData();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.code || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <article className="detail-page">
      <div className="container">
        <Link to="/work" className="back-link">
          ← Back to Work
        </Link>
        <header className="detail-header">
          <h1>{snippet.title}</h1>
          <div className="detail-meta">
            {snippet.language ? <span className="category">{snippet.language}</span> : null}
            {snippet.category ? <span className="category">{snippet.category}</span> : null}
            {snippet.publishedAt ? <time>{formatDate(snippet.publishedAt)}</time> : null}
          </div>
          {snippet.tags?.length ? (
            <div className="tags">
              {snippet.tags.map((t) => (
                <span className="tag" key={t}>
                  {t}
                </span>
              ))}
            </div>
          ) : null}
          {snippet.description ? <p className="description">{snippet.description}</p> : null}
        </header>
        <div className="code-block">
          <div className="code-header">
            <span className="code-lang">{snippet.language || 'text'}</span>
            <button type="button" className="copy-btn" onClick={copy}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre>
            <code className={`language-${snippet.language || 'text'}`}>{snippet.code || ''}</code>
          </pre>
        </div>
      </div>
    </article>
  );
}

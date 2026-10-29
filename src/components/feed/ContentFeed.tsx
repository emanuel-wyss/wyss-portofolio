import { useEffect, useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { getFeed, type FeedItem, type FeedItemType } from '../../lib/api';

type FeedMode = 'latest' | 'work';

type Props = {
  mode: FeedMode;
  limit?: number;
  initialType?: FeedItemType | 'all';
};

function cardHref(item: FeedItem): string {
  if (item.type === 'post') return `/posts/${item.slug}`;
  if (item.type === 'snippet') return `/snippets/${item.slug}`;
  return `/gallery/${item.slug}`;
}

function cardLabel(item: FeedItem): string {
  if (item.type === 'post') return 'Post';
  if (item.type === 'snippet') return 'Snippet';
  return 'Gallery';
}

export function ContentFeed({ mode, limit = 12, initialType = 'all' }: Props) {
  const [currentType, setCurrentType] = useState<FeedItemType | 'all'>(initialType);
  const [currentPage, setCurrentPage] = useState(1);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isWorkMode = mode === 'work';

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    getFeed(1, limit, currentType)
      .then((data) => {
        if (!mounted) return;
        setItems(data.items);
        setCurrentPage(data.page);
        setHasNextPage(data.hasNextPage);
      })
      .catch(() => {
        if (!mounted) return;
        setError('Could not load content.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [currentType, limit]);

  const loadMore = async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await getFeed(currentPage + 1, limit, currentType);
      setItems((prev) => prev.concat(next.items));
      setCurrentPage(next.page);
      setHasNextPage(next.hasNextPage);
    } catch {
      setError('Could not load more content.');
    } finally {
      setLoading(false);
    }
  };

  const tabs = useMemo(
    () => [
      { key: 'all' as const, label: 'All' },
      { key: 'post' as const, label: 'Posts' },
      { key: 'snippet' as const, label: 'Snippets' },
      { key: 'gallery' as const, label: 'Galleries' },
    ],
    [],
  );

  return (
    <section>
      {isWorkMode ? (
        <nav className="feed-tabs" aria-label="Content type filter">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={currentType === tab.key ? 'active' : ''}
              onClick={() => setCurrentType(tab.key)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </nav>
      ) : null}

      {error ? <p className="muted">{error}</p> : null}

      <div className="feed-grid">
        {items.map((item) => (
          <article key={`${item.type}-${item.id}`} className="feed-card">
            <span className={`feed-badge ${item.type}`}>{cardLabel(item)}</span>
            <h3>{item.title}</h3>
            <p>{item.description || ''}</p>
            <div className="feed-meta">
              {item.category ? <span>{item.category}</span> : null}
              {item.language ? <span>{item.language}</span> : null}
              <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
            </div>
            <Link to={cardHref(item)}>{item.type === 'gallery' ? 'View album' : 'Read more'} →</Link>
          </article>
        ))}
      </div>

      {loading ? <p className="muted">Loading...</p> : null}
      {!loading && items.length === 0 ? <p className="muted">No content found.</p> : null}
      {isWorkMode && hasNextPage ? (
        <button type="button" className="feed-load-more" onClick={loadMore} disabled={loading}>
          Load more
        </button>
      ) : null}
    </section>
  );
}

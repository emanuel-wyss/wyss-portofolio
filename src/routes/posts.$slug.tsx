import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { getPostBySlug } from '../lib/api';

export const Route = createFileRoute('/posts/$slug')({
  loader: async ({ params }) => {
    const post = await getPostBySlug(params.slug);
    if (!post) throw notFound();
    return { post };
  },
  component: PostDetailPage,
});

function formatDate(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function PostDetailPage() {
  const { post } = Route.useLoaderData();

  return (
    <article className="detail-page">
      <div className="container">
        <Link to="/work" className="back-link">
          ← Back to Work
        </Link>
        {post.featured_image ? (
          <img src={post.featured_image} alt={post.title} className="featured-image" />
        ) : null}
        <header className="detail-header">
          <h1>{post.title}</h1>
          <div className="detail-meta">
            {post.category ? <span className="category">{post.category}</span> : null}
            {post.publishedAt ? <time>{formatDate(post.publishedAt)}</time> : null}
          </div>
          {post.tags?.length ? (
            <div className="tags">
              {post.tags.map((t) => (
                <span className="tag" key={t}>
                  {t}
                </span>
              ))}
            </div>
          ) : null}
        </header>
        {post.contentHtml ? (
          <div className="prose" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
        ) : (
          <div className="prose">
            <p>{post.excerpt}</p>
          </div>
        )}
      </div>
    </article>
  );
}

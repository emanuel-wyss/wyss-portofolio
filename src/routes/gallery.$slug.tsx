import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { getAlbumBySlug } from '../lib/api';

export const Route = createFileRoute('/gallery/$slug')({
  loader: async ({ params }) => {
    const album = await getAlbumBySlug(params.slug);
    if (!album) throw notFound();
    return { album };
  },
  component: GalleryDetailPage,
});

function GalleryDetailPage() {
  const { album } = Route.useLoaderData();
  const images = [...(album.images || [])]
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .filter((img) => img.url);

  return (
    <article className="detail-page">
      <div className="container">
        <Link to="/work" className="back-link">
          ← Back to Work
        </Link>
        <header className="detail-header">
          <h1>{album.title}</h1>
          {album.album ? <p className="album-name">{album.album}</p> : null}
          {album.description ? <p className="description">{album.description}</p> : null}
        </header>
        <div className="gallery-grid">
          {images.map((img) => (
            <figure className="gallery-item" key={img.id}>
              <img src={img.url} alt={img.alt || album.title} loading="lazy" />
              {img.caption ? <figcaption>{img.caption}</figcaption> : null}
            </figure>
          ))}
        </div>
      </div>
    </article>
  );
}

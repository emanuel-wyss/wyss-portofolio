import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { getAlbumBySlug } from '../lib/api';

export const Route = createFileRoute('/gallery/$slug')({
  loader: async ({ params }) => {
    const album = await getAlbumBySlug(params.slug);
    if (!album) throw notFound();
    return { album };
  },
  component: GalleryDetailPage,
});

function formatBytes(bytes?: number): string | null {
  if (!bytes || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function fileFromUrl(url: string, fallback?: string): string {
  if (fallback) return fallback;
  try {
    const clean = url.split('?')[0];
    return decodeURIComponent(clean.substring(clean.lastIndexOf('/') + 1)) || 'image';
  } catch {
    return 'image';
  }
}

function inferMime(url: string, fallback?: string): string {
  if (fallback) return fallback;
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
  if (!ext) return 'image/*';
  if (ext === 'jpg') return 'image/jpeg';
  return `image/${ext}`;
}

function GalleryDetailPage() {
  const { album } = Route.useLoaderData();
  const images = [...(album.images || [])]
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .filter((img) => img.url);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [naturalDim, setNaturalDim] = useState<{ w: number; h: number } | null>(null);
  const [showMeta, setShowMeta] = useState<boolean>(true);

  const activeImg = activeIndex !== null ? images[activeIndex] : null;

  useEffect(() => {
    if (activeIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveIndex(null);
      } else if (e.key === 'ArrowRight') {
        setNaturalDim(null);
        setActiveIndex((idx) => (idx === null ? 0 : (idx + 1) % images.length));
      } else if (e.key === 'ArrowLeft') {
        setNaturalDim(null);
        setActiveIndex((idx) => (idx === null ? 0 : (idx - 1 + images.length) % images.length));
      } else if (e.key.toLowerCase() === 'i') {
        setShowMeta((v) => !v);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, images.length]);

  const openAt = (idx: number) => {
    setNaturalDim(null);
    setActiveIndex(idx);
  };

  const w = activeImg?.width || naturalDim?.w || null;
  const h = activeImg?.height || naturalDim?.h || null;
  const ratio = w && h ? (w / h).toFixed(2) : null;
  const sizeLabel = formatBytes(activeImg?.filesize);

  return (
    <article className="detail-page">
      <div className="container" data-label={`// gallery/${album.slug}`}>
        <Link to="/work" className="back-link">
          ← Back to Work
        </Link>
        <header className="detail-header">
          <h1>{album.title}</h1>
          {album.album ? <p className="album-name">{album.album}</p> : null}
          {album.description ? <p className="description">{album.description}</p> : null}
        </header>

        <div className="gallery-grid">
          {images.map((img, idx) => (
            <figure
              className="gallery-item gallery-item--interactive"
              key={img.id || idx}
              onClick={() => openAt(idx)}
              role="button"
              tabIndex={0}
              aria-label={`Inspect image ${idx + 1}: ${img.alt || album.title}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openAt(idx);
                }
              }}
            >
              <img src={img.url} alt={img.alt || album.title} loading="lazy" />
              <div className="gallery-item-overlay">
                <span className="gallery-item-idx">
                  [{String(idx + 1).padStart(2, '0')}/{String(images.length).padStart(2, '0')}]
                </span>
                <span className="gallery-item-hint">INSPECT ↗</span>
              </div>
              {img.caption ? <figcaption>{img.caption}</figcaption> : null}
            </figure>
          ))}
        </div>
      </div>

      {activeImg && activeIndex !== null ? (
        <div
          className="nerdy-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={activeImg.alt || album.title}
          onClick={() => setActiveIndex(null)}
        >
          <div className="nerdy-lightbox-window" onClick={(e) => e.stopPropagation()}>
            {/* Terminal Chrome Header */}
            <header className="nerdy-lightbox-bar">
              <div className="nerdy-lightbox-title">
                <span className="tag-badge">IMG_VIEWER</span>
                <span>
                  [{String(activeIndex + 1).padStart(2, '0')}/{String(images.length).padStart(2, '0')}]
                </span>
                <span className="filename">{fileFromUrl(activeImg.url, activeImg.filename)}</span>
              </div>
              <div className="nerdy-lightbox-controls">
                {images.length > 1 ? (
                  <>
                    <button
                      type="button"
                      className="term-chip"
                      onClick={() => {
                        setNaturalDim(null);
                        setActiveIndex((activeIndex - 1 + images.length) % images.length);
                      }}
                      aria-label="Previous image"
                    >
                      ← prev
                    </button>
                    <button
                      type="button"
                      className="term-chip"
                      onClick={() => {
                        setNaturalDim(null);
                        setActiveIndex((activeIndex + 1) % images.length);
                      }}
                      aria-label="Next image"
                    >
                      next →
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  className="term-chip"
                  onClick={() => setShowMeta((v) => !v)}
                  aria-pressed={showMeta}
                >
                  meta:{showMeta ? 'on' : 'off'}
                </button>
                <button type="button" className="term-chip" onClick={() => setActiveIndex(null)}>
                  esc:close
                </button>
              </div>
            </header>

            {/* Stage + Floating Nerdy Metadata Infobox */}
            <div className="nerdy-lightbox-stage">
              <img
                key={activeImg.url}
                src={activeImg.url}
                alt={activeImg.alt || album.title}
                className="nerdy-lightbox-img"
                onLoad={(e) => {
                  const el = e.currentTarget;
                  if (el.naturalWidth && el.naturalHeight) {
                    setNaturalDim({ w: el.naturalWidth, h: el.naturalHeight });
                  }
                }}
              />

              {showMeta ? (
                <aside className="nerdy-lightbox-meta" aria-label="Image metadata">
                  <div className="meta-head">INSPECT // EXIF_AND_META</div>
                  <dl className="meta-grid">
                    <div>
                      <dt>FILE</dt>
                      <dd>{fileFromUrl(activeImg.url, activeImg.filename)}</dd>
                    </div>
                    <div>
                      <dt>FORMAT</dt>
                      <dd>{inferMime(activeImg.url, activeImg.mimeType)}</dd>
                    </div>
                    {w && h ? (
                      <div>
                        <dt>DIMENSIONS</dt>
                        <dd>
                          {w} × {h}px {ratio ? `(${ratio}:1)` : ''}
                        </dd>
                      </div>
                    ) : null}
                    {sizeLabel ? (
                      <div>
                        <dt>FILESIZE</dt>
                        <dd>{sizeLabel}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt>ALBUM</dt>
                      <dd>{album.title}</dd>
                    </div>
                    {activeImg.createdAt || album.publishedAt ? (
                      <div>
                        <dt>TIMESTAMP</dt>
                        <dd>
                          {new Date(activeImg.createdAt || album.publishedAt).toISOString().slice(0, 10)}
                        </dd>
                      </div>
                    ) : null}
                    {activeImg.alt ? (
                      <div className="meta-full">
                        <dt>ALT</dt>
                        <dd>{activeImg.alt}</dd>
                      </div>
                    ) : null}
                    {activeImg.caption ? (
                      <div className="meta-full">
                        <dt>CAPTION</dt>
                        <dd>{activeImg.caption}</dd>
                      </div>
                    ) : null}
                  </dl>
                </aside>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}

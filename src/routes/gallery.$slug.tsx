import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [showMeta, setShowMeta] = useState<boolean>(true);
  const [naturalDim, setNaturalDim] = useState<{ w: number; h: number } | null>(null);
  const touchX = useRef<number | null>(null);
  // SVG refraction in backdrop-filter only renders in Chromium.
  const [liquid] = useState(() => typeof navigator !== 'undefined' && 'userAgentData' in navigator);
  const [reduceMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  // Rect of the clicked thumbnail, used to zoom it into the lightbox (FLIP)
  const originRect = useRef<DOMRect | null>(null);

  const activeImg = activeIndex !== null ? images[activeIndex] : null;
  const w = activeImg?.width || naturalDim?.w || null;
  const h = activeImg?.height || naturalDim?.h || null;
  const ratio = w && h ? (w / h).toFixed(2) : null;
  const sizeLabel = formatBytes(activeImg?.filesize);

  const goPrev = () => {
    setNaturalDim(null);
    setActiveIndex((idx) => (idx === null ? 0 : (idx - 1 + images.length) % images.length));
  };
  const goNext = () => {
    setNaturalDim(null);
    setActiveIndex((idx) => (idx === null ? 0 : (idx + 1) % images.length));
  };
  const openAt = (idx: number, el?: HTMLElement | null) => {
    originRect.current = el?.querySelector('img')?.getBoundingClientRect() ?? null;
    setNaturalDim(null);
    setActiveIndex(idx);
  };

  const lightboxRef = useRef<HTMLDivElement>(null);
  const thumbAt = (idx: number) =>
    document.querySelectorAll<HTMLElement>('.gallery-item--interactive')[idx] ?? null;

  // Keep the underlying thumbnail in sync with the image shown in the lightbox:
  // scroll it into view (so closing zooms back to a visible thumbnail) and mark it.
  useEffect(() => {
    if (activeIndex === null) return;
    const thumb = thumbAt(activeIndex);
    if (!thumb) return;
    thumb.classList.add('is-current');
    thumb.scrollIntoView({ block: 'nearest', behavior: 'instant' as ScrollBehavior });
    return () => thumb.classList.remove('is-current');
  }, [activeIndex]);

  // Close and hand focus back to the thumbnail of the last viewed image.
  const finishClose = (idx: number) => {
    setActiveIndex(null);
    requestAnimationFrame(() => {
      const thumb = thumbAt(idx);
      if (!thumb) return;
      // Browsers hide :focus-visible after mouse clicks, so mark it explicitly
      // until focus leaves; works the same for Esc, close button and backdrop.
      thumb.classList.add('is-focus-return');
      thumb.addEventListener('blur', () => thumb.classList.remove('is-focus-return'), { once: true });
      thumb.focus({ preventScroll: true });
    });
  };
  const closing = useRef(false);

  // Zoom the image back into its thumbnail, fade the backdrop, then unmount.
  const closeLightbox = () => {
    if (closing.current || activeIndex === null) return;
    const lightbox = lightboxRef.current;
    const img = lightbox?.querySelector<HTMLImageElement>('.nerdy-lightbox-img');
    const idx = activeIndex;
    const thumb = thumbAt(idx)?.querySelector('img');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!lightbox || !img || !thumb || reduce) {
      finishClose(idx);
      return;
    }
    closing.current = true;
    const from = img.getBoundingClientRect();
    const to = thumb.getBoundingClientRect();
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const scale = to.width / from.width;
    const opts = { duration: 320, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' as const };
    lightbox.classList.add('is-closing');
    const anim = img.animate(
      [
        { transform: 'none', borderRadius: '6px' },
        { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, borderRadius: '10px' },
      ],
      opts,
    );
    anim.finished.finally(() => {
      closing.current = false;
      finishClose(idx);
    });
  };

  // Zoom from the thumbnail position into the final lightbox position.
  const zoomFromThumb = (img: HTMLImageElement) => {
    const from = originRect.current;
    originRect.current = null;
    img.style.visibility = 'visible';
    if (!from || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const to = img.getBoundingClientRect();
    if (!to.width || !to.height) return;
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    const scale = from.width / to.width;
    img.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, borderRadius: '10px' },
        { transform: 'none', borderRadius: '6px' },
      ],
      { duration: 380, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    );
  };

  // Lock background scroll while open
  useEffect(() => {
    if (activeIndex === null) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = 'hidden';
    root.setAttribute('data-lightbox-open', '');
    return () => {
      root.style.overflow = prev;
      root.removeAttribute('data-lightbox-open');
    };
  }, [activeIndex]);

  useEffect(() => {
    if (activeIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key.toLowerCase() === 'i') setShowMeta((v) => !v);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, images.length]);

  const exif = activeImg?.exif;
  const settingsSummary = [exif?.focalLength, exif?.aperture, exif?.exposure, exif?.iso ? `ISO ${exif.iso}` : undefined]
    .filter(Boolean)
    .join(' · ');

  const lightboxNode =
    activeImg && activeIndex !== null && typeof document !== 'undefined'
      ? createPortal(
          <div
            className={`nerdy-lightbox${liquid ? ' has-liquid' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label={activeImg.alt || album.title}
            ref={lightboxRef}
            onClick={closeLightbox}
          >
            {liquid ? (
              <svg className="lb-liquid-defs" aria-hidden="true" focusable="false">
                <filter id="lb-liquid" x="0" y="0" width="100%" height="100%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.006 0.009" numOctaves="2" seed="7" result="noise">
                    {reduceMotion ? null : (
                      <animate attributeName="baseFrequency" dur="14s" repeatCount="indefinite"
                        values="0.006 0.009;0.009 0.006;0.006 0.009" />
                    )}
                  </feTurbulence>
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="42" xChannelSelector="R" yChannelSelector="G" />
                </filter>
              </svg>
            ) : null}
            <div className="nerdy-lightbox-window" onClick={(e) => e.stopPropagation()}>
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
                      <button type="button" className="term-chip" onClick={goPrev} aria-label="Previous image">
                        ← prev
                      </button>
                      <button type="button" className="term-chip" onClick={goNext} aria-label="Next image">
                        next →
                      </button>
                    </>
                  ) : null}
                  <a
                    className="term-chip"
                    href={activeImg.url}
                    download={fileFromUrl(activeImg.url, activeImg.filename)}
                    title="Download full resolution"
                  >
                    download ↓
                  </a>
                  <button type="button" className="term-chip" onClick={() => setShowMeta((v) => !v)} aria-pressed={showMeta}>
                    exif:{showMeta ? 'on' : 'off'}
                  </button>
                  <button type="button" className="term-chip" onClick={closeLightbox}>
                    esc:close
                  </button>
                </div>
              </header>

              <div className={`nerdy-lightbox-stage ${showMeta ? '' : 'nerdy-lightbox-stage--full'}`}>
                <div
                  className="nerdy-lightbox-viewport"
                  onTouchStart={(e) => {
                    touchX.current = e.touches[0].clientX;
                  }}
                  onTouchEnd={(e) => {
                    if (touchX.current === null || images.length < 2) return;
                    const dx = e.changedTouches[0].clientX - touchX.current;
                    touchX.current = null;
                    if (Math.abs(dx) > 50) (dx < 0 ? goNext : goPrev)();
                  }}
                >
                  <picture key={activeImg.url}>
                    {activeImg.thumbUrl ? <source media="(max-width: 640px)" srcSet={activeImg.thumbUrl} /> : null}
                    <img
                      src={activeImg.displayUrl || activeImg.url}
                      decoding="async"
                      alt={activeImg.alt || album.title}
                      draggable={false}
                      className="nerdy-lightbox-img"
                      style={{ visibility: 'hidden' }}
                      onLoad={(e) => {
                        const el = e.currentTarget;
                        if (el.naturalWidth) setNaturalDim({ w: el.naturalWidth, h: el.naturalHeight });
                        zoomFromThumb(el);
                      }}
                    />
                  </picture>
                </div>

                {showMeta ? (
                  <aside className="nerdy-lightbox-meta" aria-label="Image EXIF and metadata">
                    <div className="meta-head">INSPECT // EXIF_TELEMETRY</div>
                    <dl className="meta-grid">
                      {exif?.camera ? (
                        <div>
                          <dt>CAMERA MODEL</dt>
                          <dd>{exif.camera}</dd>
                        </div>
                      ) : null}
                      {exif?.lens ? (
                        <div>
                          <dt>OBJECTIVE / LENS</dt>
                          <dd>{exif.lens}</dd>
                        </div>
                      ) : null}
                      {settingsSummary ? (
                        <div>
                          <dt>EXPOSURE SETTINGS</dt>
                          <dd className="meta-accent">{settingsSummary}</dd>
                        </div>
                      ) : null}
                      {exif?.capturedAt ? (
                        <div>
                          <dt>CAPTURED (EXIF)</dt>
                          <dd>{exif.capturedAt}</dd>
                        </div>
                      ) : null}
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
                        <dt>FORMAT</dt>
                        <dd>{inferMime(activeImg.url, activeImg.mimeType)}</dd>
                      </div>
                      <div>
                        <dt>FILE</dt>
                        <dd>
                          <a href={activeImg.url} target="_blank" rel="noreferrer">
                            {fileFromUrl(activeImg.url, activeImg.filename)} ↗
                          </a>
                        </dd>
                      </div>
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
          </div>,
          document.body,
        )
      : null;

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
              onClick={(e) => openAt(idx, e.currentTarget)}
              role="button"
              tabIndex={0}
              aria-label={`Inspect image ${idx + 1}: ${img.alt || album.title}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openAt(idx, e.currentTarget);
                }
              }}
            >
              <picture>
                <source media="(max-width: 640px)" srcSet={img.thumbUrl || img.url} />
                <source media="(max-width: 1200px)" srcSet={img.displayUrl || img.url} />
                <img src={img.displayUrl || img.url} alt={img.alt || album.title} loading="lazy" />
              </picture>
              <div className="gallery-item-overlay">
                <span className="gallery-item-idx">
                  [{String(idx + 1).padStart(2, '0')}/{String(images.length).padStart(2, '0')}]
                </span>
                <span className="gallery-item-hint">INSPECT ↗</span>
              </div>
            </figure>
          ))}
        </div>
      </div>

      {lightboxNode}
    </article>
  );
}

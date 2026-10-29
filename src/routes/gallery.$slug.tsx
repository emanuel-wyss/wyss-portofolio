import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
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
  const [fittedWidth, setFittedWidth] = useState<number>(800);
  const [showMeta, setShowMeta] = useState<boolean>(true);

  // Zoom & Pan state (1 = fit to stage, maxZoom = 1:1 original pixel resolution)
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number; moved: boolean }>({
    x: 0,
    y: 0,
    panX: 0,
    panY: 0,
    moved: false,
  });
  const imgRef = useRef<HTMLImageElement>(null);

  const activeImg = activeIndex !== null ? images[activeIndex] : null;
  const w = activeImg?.width || naturalDim?.w || null;
  const h = activeImg?.height || naturalDim?.h || null;
  const ratio = w && h ? (w / h).toFixed(2) : null;
  const sizeLabel = formatBytes(activeImg?.filesize);

  // Maximum zoom reaches exact 1:1 original resolution (at least 3x if unknown)
  const maxZoom = w && fittedWidth > 0 ? Math.max(2.5, Number((w / fittedWidth).toFixed(2))) : 4;

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setNaturalDim(null);
  };

  const applyZoom = (nextZoom: number) => {
    const clamped = Math.min(maxZoom, Math.max(1, Number(nextZoom.toFixed(2))));
    setZoom(clamped);
    if (clamped <= 1.01) {
      setPan({ x: 0, y: 0 });
    }
  };

  const cycleZoom = () => {
    if (zoom < 1.8) {
      applyZoom(Math.min(2, maxZoom));
    } else if (zoom < maxZoom - 0.15) {
      applyZoom(maxZoom); // 1:1 Original size
    } else {
      applyZoom(1); // Back down to fit
    }
  };

  useEffect(() => {
    if (activeIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveIndex(null);
      } else if (e.key === 'ArrowRight') {
        resetView();
        setActiveIndex((idx) => (idx === null ? 0 : (idx + 1) % images.length));
      } else if (e.key === 'ArrowLeft') {
        resetView();
        setActiveIndex((idx) => (idx === null ? 0 : (idx - 1 + images.length) % images.length));
      } else if (e.key.toLowerCase() === 'i') {
        setShowMeta((v) => !v);
      } else if (e.key === '+' || e.key === '=') {
        applyZoom(zoom + 0.5);
      } else if (e.key === '-') {
        applyZoom(zoom - 0.5);
      } else if (e.key === '0') {
        applyZoom(1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, images.length, zoom, maxZoom]);

  const openAt = (idx: number) => {
    resetView();
    setActiveIndex(idx);
  };

  const exif = activeImg?.exif;
  const settingsSummary = [
    exif?.focalLength,
    exif?.aperture,
    exif?.exposure,
    exif?.iso ? `ISO ${exif.iso}` : undefined,
  ]
    .filter(Boolean)
    .join(' · ');

  const isOneToOne = Math.abs(zoom - maxZoom) < 0.08;
  const zoomLabel =
    zoom <= 1.01 ? 'fit' : isOneToOne ? `1:1 (${Math.round(zoom * 100)}%)` : `${Math.round(zoom * 100)}%`;

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
              <img src={img.thumbUrl || img.url} alt={img.alt || album.title} loading="lazy" />
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
                <button
                  type="button"
                  className="term-chip"
                  onClick={() => applyZoom(zoom - 0.6)}
                  disabled={zoom <= 1}
                  title="Zoom out (-)"
                >
                  -
                </button>
                <button
                  type="button"
                  className="term-chip"
                  onClick={cycleZoom}
                  title="Click to cycle Fit → 2× → 1:1 Original Resolution → Fit"
                >
                  zoom:{zoomLabel}
                </button>
                <button
                  type="button"
                  className="term-chip"
                  onClick={() => applyZoom(zoom + 0.6)}
                  disabled={zoom >= maxZoom}
                  title="Zoom in up to 1:1 original size (+)"
                >
                  +
                </button>

                {images.length > 1 ? (
                  <>
                    <button
                      type="button"
                      className="term-chip"
                      onClick={() => {
                        resetView();
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
                        resetView();
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
                  exif:{showMeta ? 'on' : 'off'}
                </button>
                <button type="button" className="term-chip" onClick={() => setActiveIndex(null)}>
                  esc:close
                </button>
              </div>
            </header>

            {/* Stage + Floating Nerdy EXIF Infobox */}
            <div className={`nerdy-lightbox-stage ${showMeta ? '' : 'nerdy-lightbox-stage--full'}`}>
              <div
                className="nerdy-lightbox-viewport"
                onWheel={(e) => {
                  e.preventDefault();
                  const delta = e.deltaY < 0 ? 0.35 : -0.35;
                  applyZoom(zoom + delta);
                }}
                onPointerDown={(e) => {
                  if (zoom <= 1) return;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setDragging(true);
                  dragStartRef.current = {
                    x: e.clientX,
                    y: e.clientY,
                    panX: pan.x,
                    panY: pan.y,
                    moved: false,
                  };
                }}
                onPointerMove={(e) => {
                  if (!dragging) return;
                  const dx = e.clientX - dragStartRef.current.x;
                  const dy = e.clientY - dragStartRef.current.y;
                  if (Math.hypot(dx, dy) > 4) dragStartRef.current.moved = true;
                  setPan({
                    x: dragStartRef.current.panX + dx,
                    y: dragStartRef.current.panY + dy,
                  });
                }}
                onPointerUp={() => setDragging(false)}
                onClick={() => {
                  if (dragStartRef.current.moved) {
                    dragStartRef.current.moved = false;
                    return;
                  }
                  cycleZoom();
                }}
                style={{
                  cursor: zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'zoom-in',
                }}
              >
                <img
                  ref={imgRef}
                  key={activeImg.url}
                  src={activeImg.url}
                  alt={activeImg.alt || album.title}
                  draggable={false}
                  className="nerdy-lightbox-img"
                  style={{
                    transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
                    transition: dragging ? 'none' : 'transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                  onLoad={(e) => {
                    const el = e.currentTarget;
                    if (el.naturalWidth && el.naturalHeight) {
                      setNaturalDim({ w: el.naturalWidth, h: el.naturalHeight });
                    }
                    if (el.clientWidth > 0) {
                      setFittedWidth(el.clientWidth);
                    }
                  }}
                />
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
                    {exif?.aperture ? (
                      <div>
                        <dt>APERTURE</dt>
                        <dd>{exif.aperture}</dd>
                      </div>
                    ) : null}
                    {exif?.exposure ? (
                      <div>
                        <dt>SHUTTER SPEED</dt>
                        <dd>{exif.exposure}</dd>
                      </div>
                    ) : null}
                    {exif?.focalLength ? (
                      <div>
                        <dt>FOCAL LENGTH</dt>
                        <dd>{exif.focalLength}</dd>
                      </div>
                    ) : null}
                    {exif?.iso ? (
                      <div>
                        <dt>ISO</dt>
                        <dd>{exif.iso}</dd>
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
                      <dd>{fileFromUrl(activeImg.url, activeImg.filename)}</dd>
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
        </div>
      ) : null}
    </article>
  );
}

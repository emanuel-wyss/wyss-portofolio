import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { useEffect, useRef, useState, type PointerEvent as RPointerEvent, type ReactNode } from 'react';
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
  // SVG filters in backdrop-filter only render in Chromium.
  const [liquid] = useState(() => typeof navigator !== 'undefined' && 'userAgentData' in navigator);
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const lightboxRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  // During a transition: the image melting away (from) and the one forming (to).
  const [melt, setMelt] = useState<{ from: number; to: number } | null>(null);
  const meltOutRef = useRef<SVGFEDisplacementMapElement>(null);
  const meltInRef = useRef<SVGFEDisplacementMapElement>(null);
  const meltNoiseRef = useRef<SVGFETurbulenceElement>(null);
  const meltInNoiseRef = useRef<SVGFETurbulenceElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const meltAnim = useRef(0);
  const rippleRef = useRef<SVGFEDisplacementMapElement>(null);
  const waveNoiseRef = useRef<SVGFETurbulenceElement>(null);
  // Rect of the clicked thumbnail, used to zoom it into the lightbox (FLIP)
  const originRect = useRef<DOMRect | null>(null);
  const closing = useRef(false);
  const suppressClick = useRef(false);
  // Drag state for the slider
  const drag = useRef<{ id: number; x0: number; y0: number; dx: number; t: number; v: number; axis: 'x' | 'y' | null } | null>(null);

  const count = images.length;
  const activeImg = activeIndex !== null ? images[activeIndex] : null;

  const thumbAt = (idx: number) =>
    document.querySelectorAll<HTMLElement>('.gallery-item--interactive')[idx] ?? null;
  const currentImg = () => stageRef.current?.querySelector<HTMLImageElement>('.lb-layer--from img') ?? null;

  // ---- water waves on the backdrop: strength follows slide speed, waves travel
  // with the slide direction, then the glass settles back to (almost) calm.
  // resting refraction of the glass: visible but calm
  const WAVE_REST = 3;
  const wave = useRef({ amt: WAVE_REST, raf: 0 });
  const applyWave = () => {
    const w = wave.current;
    rippleRef.current?.setAttribute('scale', w.amt.toFixed(1));
    // background water shares the image's wave pattern (same smooth noise)
    const freq = meltNoiseRef.current?.getAttribute('baseFrequency');
    if (freq) waveNoiseRef.current?.setAttribute('baseFrequency', freq);
    // Chromium caches backdrop-filter output; nudge it so attribute changes repaint
    const el = lightboxRef.current;
    if (el) el.style.setProperty('--wave', String(Math.round(w.amt * 10)));
  };
  const kickWave = (amount: number) => {
    if (!liquid || reduceMotion()) return;
    const w = wave.current;
    w.amt = Math.min(22, Math.max(w.amt, amount));
    if (w.raf) return;
    const step = () => {
      w.amt = WAVE_REST + (w.amt - WAVE_REST) * 0.92;
      applyWave();
      if (w.amt - WAVE_REST > 0.3) w.raf = requestAnimationFrame(step);
      else {
        w.amt = WAVE_REST;
        w.raf = 0;
        applyWave();
      }
    };
    w.raf = requestAnimationFrame(step);
  };

  // ---- liquid melt between images ----------------------------------------
  // p: 0 = only the old image (sharp), 1 = only the new image (sharp).
  // The old image dissolves into turbulent water while the new one condenses out of it.
  // Fitted on-screen box for an image in the stage (contain within available area).
  const fitBox = (idx: number) => {
    const stage = stageRef.current;
    const img = images[idx];
    if (!stage || !img) return null;
    const cs = getComputedStyle(stage);
    const pad = parseFloat(cs.getPropertyValue('--lb-pad')) || 24;
    const maxW = stage.clientWidth - pad * 2;
    const maxH = stage.clientHeight - pad * 2;
    const ar = img.width && img.height ? img.width / img.height : 1.5;
    const w = Math.min(maxW, maxH * ar);
    return { w, h: w / ar };
  };
  const sizeFrame = (p: number) => {
    const m = meltRef.current;
    const frame = frameRef.current;
    if (!frame) return;
    const a = fitBox(m ? m.from : activeIndex ?? 0);
    const b = m ? fitBox(m.to) : a;
    if (!a || !b) return;
    // ease the box between the two aspect ratios
    const k = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    frame.style.width = `${(a.w + (b.w - a.w) * k).toFixed(1)}px`;
    frame.style.height = `${(a.h + (b.h - a.h) * k).toFixed(1)}px`;
  };

  const MELT_MAX = 46;
  // Two transition looks:
  //  - 'splash': click / arrow / buttons — concentric ripples spreading from a point
  //  - 'swipe' : drag — a linear wave front that travels with the finger
  // Both images blur through the middle so the swap reads as one soft movement.
  const renderMelt = (p: number, dir: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const m = meltRef.current;
    const mode = m?.mode ?? 'splash';
    const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    const bell = Math.sin(p * Math.PI); // 0 → 1 (midpoint) → 0
    const amt = MELT_MAX * bell;
    meltOutRef.current?.setAttribute('scale', amt.toFixed(1));
    meltInRef.current?.setAttribute('scale', (amt * 0.8).toFixed(1));
    const st = stage.style;
    st.setProperty('--melt-out', String(1 - ease));
    st.setProperty('--melt-in', String(ease));
    st.setProperty('--melt-tone', bell.toFixed(3));
    st.setProperty('--melt-blur', `${(bell * 8).toFixed(2)}px`);
    if (mode === 'splash') {
      // ripple rings expand outward from the origin
      st.setProperty('--ring', `${(p * 140).toFixed(1)}%`);
      st.setProperty('--ox', `${m?.ox ?? 50}%`);
      st.setProperty('--oy', `${m?.oy ?? 50}%`);
    } else {
      // wave front position follows progress in the drag direction
      st.setProperty('--front', `${(dir > 0 ? 100 - p * 120 : p * 120 - 20).toFixed(1)}%`);
    }
    st.setProperty('--melt-shift', '0%');
    st.setProperty('--melt-shift-out', '0%');
    kickWave(4 + bell * 14);
    if (m) m.p = p;
    sizeFrame(p);
  };

  const resetMeltVisuals = () => {
    meltOutRef.current?.setAttribute('scale', '0');
    meltInRef.current?.setAttribute('scale', '0');
    const st = stageRef.current?.style;
    st?.setProperty('--melt-out', '1');
    st?.setProperty('--melt-in', '0');
    st?.setProperty('--melt-tone', '0');
    st?.setProperty('--melt-blur', '0px');
  };
  const endMelt = () => {
    cancelAnimationFrame(meltAnim.current);
    meltAnim.current = 0;
    setMelt(null);
    resetMeltVisuals();
  };

  // Animate progress from `from` to `to` (1 = arrive at target, 0 = snap back).
  const runMelt = (from: number, to: 0 | 1, dir: number, onDone: () => void) => {
    cancelAnimationFrame(meltAnim.current);
    if (reduceMotion()) {
      onDone();
      return;
    }
    const dur = 700 * Math.abs(to - from) + 120;
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      renderMelt(from + (to - from) * k, dir);
      if (k < 1) meltAnim.current = requestAnimationFrame(step);
      else {
        meltAnim.current = 0;
        onDone();
      }
    };
    meltAnim.current = requestAnimationFrame(step);
  };

  const meltRef = useRef<{ from: number; to: number; dir: number; p: number; mode: 'splash' | 'swipe'; ox: number; oy: number } | null>(null);
  const beginMelt = (to: number, dir: number, mode: 'splash' | 'swipe' = 'splash', ox = 50, oy = 50) => {
    if (activeIndex === null) return null;
    cancelAnimationFrame(meltAnim.current);
    const m = { from: activeIndex, to, dir, p: 0, mode, ox, oy };
    meltRef.current = m;
    setMelt({ from: m.from, to: m.to });
    resetMeltVisuals();
    return m;
  };
  // Land on the target image
  const commitMelt = () => {
    const m = meltRef.current;
    if (!m) return;
    runMelt(m.p, 1, m.dir, () => {
      meltRef.current = null;
      // Mark the arriving layer as settled first: no filter, full opacity.
      stageRef.current?.classList.add('is-settling');
      setActiveIndex(m.to);
      endMelt();
      requestAnimationFrame(() => stageRef.current?.classList.remove('is-settling'));
    });
  };
  // Go back to where we were
  const cancelMelt = () => {
    const m = meltRef.current;
    if (!m) return;
    runMelt(m.p, 0, m.dir, () => {
      meltRef.current = null;
      endMelt();
    });
  };

  // splash origin: pointer position if known, otherwise the edge you're moving toward
  const splashAt = useRef<{ x: number; y: number } | null>(null);
  const goTo = (idx: number, dir: number) => {
    if (activeIndex === null || count < 2 || closing.current) return;
    // finish any running melt instantly first
    const running = meltRef.current;
    const base = running ? running.to : activeIndex;
    if (running) {
      meltRef.current = null;
      setActiveIndex(base);
      endMelt();
    }
    const next = (idx - (activeIndex - base) + count) % count;
    if (next === base) return;
    const o = splashAt.current;
    splashAt.current = null;
    const rect = frameRef.current?.getBoundingClientRect();
    const ox = o && rect ? ((o.x - rect.left) / rect.width) * 100 : dir > 0 ? 85 : 15;
    const oy = o && rect ? ((o.y - rect.top) / rect.height) * 100 : 50;
    if (!beginMelt(next, dir, 'splash', ox, oy)) return;
    if (meltRef.current) meltRef.current.from = base;
    setMelt({ from: base, to: next });
    requestAnimationFrame(() => commitMelt());
  };
  const goPrevDir = () => activeIndex !== null && goTo(activeIndex - 1, -1);
  const goNextDir = () => activeIndex !== null && goTo(activeIndex + 1, 1);
  const goPrev = goPrevDir;
  const goNext = goNextDir;

  const openAt = (idx: number, el?: HTMLElement | null) => {
    originRect.current = el?.querySelector('img')?.getBoundingClientRect() ?? null;
    setActiveIndex(idx);
  };

  // On open: zoom the image out of its thumbnail.
  useEffect(() => {
    if (activeIndex === null || !originRect.current) return;
    const from = originRect.current;
    originRect.current = null;
    const img = currentImg();
    if (!from || !img || reduceMotion()) return;
    const run = () => {
      const to = img.getBoundingClientRect();
      if (!to.width) return;
      img.animate(
        [
          {
            transform: `translate(${from.left + from.width / 2 - (to.left + to.width / 2)}px, ${
              from.top + from.height / 2 - (to.top + to.height / 2)
            }px) scale(${from.width / to.width})`,
            borderRadius: '10px',
          },
          { transform: 'none', borderRadius: '6px' },
        ],
        { duration: 380, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      );
    };
    if (img.complete && img.naturalWidth) run();
    else img.addEventListener('load', run, { once: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  // Size the frame to the current image at rest, and whenever the viewport changes.
  useEffect(() => {
    if (activeIndex === null) return;
    const fit = () => !meltRef.current && sizeFrame(0);
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, melt, showMeta]);

  // Keep the underlying thumbnail in sync with the current slide.
  useEffect(() => {
    if (activeIndex === null) return;
    const thumb = thumbAt(activeIndex);
    if (!thumb) return;
    thumb.classList.add('is-current');
    thumb.scrollIntoView({ block: 'nearest', behavior: 'instant' as ScrollBehavior });
    return () => thumb.classList.remove('is-current');
  }, [activeIndex]);

  // Close and hand (visible) focus back to the thumbnail of the last viewed image.
  const finishClose = (idx: number) => {
    setActiveIndex(null);
    requestAnimationFrame(() => {
      const thumb = thumbAt(idx);
      if (!thumb) return;
      thumb.classList.add('is-focus-return');
      thumb.addEventListener('blur', () => thumb.classList.remove('is-focus-return'), { once: true });
      thumb.focus({ preventScroll: true });
    });
  };

  // Zoom the current slide back into its thumbnail, fade chrome, then unmount.
  const closeLightbox = () => {
    if (closing.current || activeIndex === null) return;
    const idx = activeIndex;
    const lightbox = lightboxRef.current;
    const img = currentImg();
    const thumb = thumbAt(idx)?.querySelector('img');
    if (!lightbox || !img || !thumb || reduceMotion()) {
      finishClose(idx);
      return;
    }
    closing.current = true;
    const from = img.getBoundingClientRect();
    const to = thumb.getBoundingClientRect();
    lightbox.classList.add('is-closing');
    img
      .animate(
        [
          { transform: 'none', borderRadius: '6px' },
          {
            transform: `translate(${to.left + to.width / 2 - (from.left + from.width / 2)}px, ${
              to.top + to.height / 2 - (from.top + from.height / 2)
            }px) scale(${to.width / from.width})`,
            borderRadius: '10px',
          },
        ],
        { duration: 320, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' },
      )
      .finished.finally(() => {
        closing.current = false;
        finishClose(idx);
      });
  };

  // ---- pointer drag / swipe: scrubs the melt toward the next/previous image
  const onPointerDown = (e: RPointerEvent) => {
    if (count < 2 || e.button !== 0 || closing.current || meltRef.current) return;
    drag.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, t: performance.now(), v: 0, axis: null };
  };
  const onPointerMove = (e: RPointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId || activeIndex === null) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (!d.axis && Math.hypot(dx, dy) > 8) {
      d.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (d.axis === 'x') {
        try {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } catch {
          /* pointer already released (e.g. fast flick); dragging still works */
        }
      }
    }
    if (d.axis !== 'x') return;
    const now = performance.now();
    d.v = (dx - d.dx) / Math.max(1, now - d.t);
    d.t = now;
    d.dx = dx;
    const dir = dx < 0 ? 1 : -1;
    // first movement or direction change: (re)target the neighbour
    if (!meltRef.current || meltRef.current.dir !== dir) {
      beginMelt((activeIndex + dir + count) % count, dir, 'swipe');
    }
    const width = stageRef.current?.clientWidth ?? window.innerWidth;
    renderMelt(Math.min(1, Math.abs(dx) / (width * 0.6)), dir);
  };
  const onPointerUp = (e: RPointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.id !== e.pointerId || d.axis !== 'x' || !meltRef.current) return;
    suppressClick.current = true; // the click after a drag must not close the lightbox
    const m = meltRef.current;
    // a flick needs real speed *and* some travel, so a nudge snaps back
    const flick = Math.abs(d.v) > 0.6 && Math.abs(d.dx) > 80 && Math.sign(-d.v) === m.dir;
    if (m.p > 0.3 || flick) commitMelt();
    else cancelMelt();
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
      meltRef.current = null;
      endMelt();
    };
  }, [activeIndex === null]);

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
  }, [activeIndex, count]);

  const exif = activeImg?.exif;
  const settingsSummary = [exif?.focalLength, exif?.aperture, exif?.exposure, exif?.iso ? `ISO ${exif.iso}` : undefined]
    .filter(Boolean)
    .join(' · ');
  const w = activeImg?.width ?? null;
  const h = activeImg?.height ?? null;
  const metaItems: Array<[string, ReactNode, boolean?]> = activeImg
    ? ([
        exif?.camera ? ['CAMERA', exif.camera] : null,
        exif?.lens ? ['LENS', exif.lens] : null,
        settingsSummary ? ['EXPOSURE', settingsSummary, true] : null,
        exif?.capturedAt ? ['CAPTURED', exif.capturedAt] : null,
        w && h ? ['DIMENSIONS', `${w} × ${h}px`] : null,
        formatBytes(activeImg.filesize) ? ['FILESIZE', formatBytes(activeImg.filesize)] : null,
        ['FORMAT', inferMime(activeImg.url, activeImg.mimeType)],
      ].filter(Boolean) as Array<[string, ReactNode, boolean?]>)
    : [];

  const lightboxNode =
    activeImg && activeIndex !== null && typeof document !== 'undefined'
      ? createPortal(
          <div
            className={`nerdy-lightbox${liquid ? ' has-liquid' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-roledescription="carousel"
            aria-label={album.title}
            ref={lightboxRef}
            onClick={() => {
              if (suppressClick.current) {
                suppressClick.current = false;
                return;
              }
              closeLightbox();
            }}
          >
            {liquid ? (
              <svg className="lb-liquid-defs" aria-hidden="true" focusable="false">
                {/* Water on the glass: same wave pattern as the image melt; it swells and
                    settles in place (no drifting), near-flat at rest. */}
                <filter id="lb-liquid" x="0" y="0" width="100%" height="100%">
                  <feTurbulence ref={waveNoiseRef} type="fractalNoise" baseFrequency="0.0035 0.009" numOctaves="2" seed="11" result="noise" />
                  <feDisplacementMap ref={rippleRef} in="SourceGraphic" in2="noise" scale={WAVE_REST} xChannelSelector="R" yChannelSelector="G" />
                </filter>
              </svg>
            ) : null}

            <header className="nerdy-lightbox-bar" onClick={(e) => e.stopPropagation()}>
              <div className="nerdy-lightbox-title">
                <span className="tag-badge">IMG_VIEWER</span>
                <span aria-live="polite">
                  [{String(activeIndex + 1).padStart(2, '0')}/{String(count).padStart(2, '0')}]
                </span>
                <span className="filename">{fileFromUrl(activeImg.url, activeImg.filename)}</span>
              </div>
              <div className="nerdy-lightbox-controls">
                {count > 1 ? (
                  <>
                    <button type="button" className="term-chip" onClick={goPrev} aria-label="Previous image">
                      ← prev
                    </button>
                    <button type="button" className="term-chip" onClick={goNext} aria-label="Next image">
                      next →
                    </button>
                  </>
                ) : null}
                <a className="term-chip" href={activeImg.url} download={fileFromUrl(activeImg.url, activeImg.filename)} title="Download full resolution">
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

            <div
              className="nerdy-lightbox-slider"
              ref={stageRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              {liquid ? (
                <svg className="lb-liquid-defs" aria-hidden="true" focusable="false">
                  {/* Displacement maps are drawn as CSS gradients on hidden elements and fed in via feImage */}
                  <filter id="lb-melt-out" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
                    <feTurbulence ref={meltNoiseRef} type="fractalNoise" baseFrequency="0.02" numOctaves="1" seed="4" result="fine" />
                    <feDisplacementMap ref={meltOutRef} in="SourceGraphic" in2="fine" scale="0" xChannelSelector="R" yChannelSelector="G" />
                  </filter>
                  <filter id="lb-melt-in" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
                    <feTurbulence ref={meltInNoiseRef} type="fractalNoise" baseFrequency="0.02" numOctaves="1" seed="9" result="fine" />
                    <feDisplacementMap ref={meltInRef} in="SourceGraphic" in2="fine" scale="0" xChannelSelector="G" yChannelSelector="R" />
                  </filter>
                </svg>
              ) : null}
              <div className="lb-frame" ref={frameRef}>
              {melt ? <div className={`lb-melt-tone lb-melt-tone--${meltRef.current?.mode ?? 'splash'}`} aria-hidden="true" /> : null}
              {(melt ? [melt.from, melt.to] : [activeIndex]).map((idx, layer) => {
                const img = images[idx];
                const isFrom = layer === 0;
                // Key by image, not by role: when a melt ends the incoming layer *becomes*
                // the current one without remounting its <img> (no blank frame / flicker).
                return (
                  <div
                    className={`lb-layer ${isFrom ? 'lb-layer--from' : 'lb-layer--to'}${melt ? ' is-melting' : ''}`}
                    key={img.id || idx}
                    aria-hidden={!isFrom}
                  >
                    <picture>
                      {img.thumbUrl ? <source media="(max-width: 640px)" srcSet={img.thumbUrl} /> : null}
                      <img
                        src={img.displayUrl || img.url}
                        decoding="async"
                        alt={isFrom ? img.alt || album.title : ''}
                        draggable={false}
                        className="nerdy-lightbox-img"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (suppressClick.current) {
                            suppressClick.current = false;
                            return;
                          }
                          // click left half = previous, right half = next; ripple starts at the pointer
                          const r = e.currentTarget.getBoundingClientRect();
                          splashAt.current = { x: e.clientX, y: e.clientY };
                          if (e.clientX < r.left + r.width / 2) goPrev();
                          else goNext();
                        }}
                      />
                    </picture>
                  </div>
                );
              })}
              </div>
            </div>

            {showMeta ? (
              <footer className="nerdy-lightbox-meta" aria-label="Image metadata" onClick={(e) => e.stopPropagation()}>
                <span className="meta-head">EXIF //</span>
                <dl className="meta-grid">
                  {metaItems.map(([k, v, accent]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd className={accent ? 'meta-accent' : undefined}>{v}</dd>
                    </div>
                  ))}
                </dl>
                {activeImg.caption || activeImg.alt ? <p className="meta-caption">{activeImg.caption || activeImg.alt}</p> : null}
              </footer>
            ) : null}
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

// server/media-tools.ts
// Uses sharp + exif-reader to:
// 1) Generate fast, cached small WebP thumbnails (/api/media/thumb) for gallery grids
// 2) Extract real camera EXIF metadata (camera model, objective/lens, exposure, aperture,
//    focal length, ISO, and real DateTimeOriginal capture timestamp).

import sharp from 'sharp';
import exifReader from 'exif-reader';

export interface ImageExif {
  camera?: string;
  lens?: string;
  focalLength?: string;
  aperture?: string;
  exposure?: string;
  iso?: number;
  capturedAt?: string;
  width?: number;
  height?: number;
  filesize?: number;
}

const ALLOWED_HOSTS = new Set([
  'media.wyss.rocks',
  'wyss.rocks',
  'www.wyss.rocks',
  'localhost',
]);

export function isAllowedMediaUrl(rawUrl: string): boolean {
  try {
    const u = new URL(rawUrl);
    return (u.protocol === 'https:' || u.protocol === 'http:') && ALLOWED_HOSTS.has(u.hostname);
  } catch {
    return false;
  }
}

function formatExposureTime(seconds?: number): string | undefined {
  if (!seconds || seconds <= 0) return undefined;
  if (seconds >= 1) return `${Number(seconds.toFixed(2))}s`;
  const denom = Math.round(1 / seconds);
  return `1/${denom}s`;
}

function formatCapturedAt(dt: unknown, offset?: string): string | undefined {
  if (!dt) return undefined;
  if (dt instanceof Date && !Number.isNaN(dt.getTime())) {
    // exif-reader parses EXIF local wall-clock time into a UTC Date object
    const iso = dt.toISOString().replace('T', ' ').slice(0, 19);
    return offset ? `${iso} (${offset})` : iso;
  }
  if (typeof dt === 'string') return dt;
  return undefined;
}

// In-memory caches so repeated gallery visits are instant.
const exifCache = new Map<string, ImageExif>();
const thumbCache = new Map<string, Uint8Array>();
const MAX_THUMB_CACHE = 80;

export async function getExifAndThumb(
  imageUrl: string,
  wantThumbWidth?: number,
): Promise<{ exif: ImageExif; thumb?: Uint8Array }> {
  if (!isAllowedMediaUrl(imageUrl)) {
    return { exif: {} };
  }

  const thumbKey = wantThumbWidth ? `${imageUrl}@w${wantThumbWidth}` : '';
  const cachedExif = exifCache.get(imageUrl);
  const cachedThumb = thumbKey ? thumbCache.get(thumbKey) : undefined;

  if (cachedExif && (!wantThumbWidth || cachedThumb)) {
    return { exif: cachedExif, thumb: cachedThumb };
  }

  const res = await fetch(imageUrl);
  if (!res.ok) return { exif: cachedExif || {} };
  const arrayBuf = await res.arrayBuffer();
  const buf = Buffer.from(arrayBuf);

  let exif = cachedExif;
  if (!exif) {
    exif = { filesize: buf.byteLength };
    try {
      const meta = await sharp(buf).metadata();
      if (meta.width) exif.width = meta.width;
      if (meta.height) exif.height = meta.height;

      if (meta.exif) {
        const parsed = exifReader(meta.exif) as any;
        const img = parsed?.Image || {};
        const photo = parsed?.Photo || {};

        const make = typeof img.Make === 'string' ? img.Make.trim() : '';
        const model = typeof img.Model === 'string' ? img.Model.trim() : '';
        if (make && model) {
          exif.camera = model.toLowerCase().startsWith(make.toLowerCase()) ? model : `${make} ${model}`;
        } else if (model || make) {
          exif.camera = model || make;
        }

        if (typeof photo.LensModel === 'string' && photo.LensModel.trim()) {
          exif.lens = photo.LensModel.trim();
        }
        if (typeof photo.FocalLength === 'number' && photo.FocalLength > 0) {
          exif.focalLength = `${Math.round(photo.FocalLength)}mm`;
        }
        if (typeof photo.FNumber === 'number' && photo.FNumber > 0) {
          exif.aperture = `f/${Number(photo.FNumber.toFixed(1))}`;
        }
        if (typeof photo.ExposureTime === 'number') {
          exif.exposure = formatExposureTime(photo.ExposureTime);
        }
        const isoVal = Array.isArray(photo.ISOSpeedRatings)
          ? photo.ISOSpeedRatings[0]
          : photo.ISOSpeedRatings ?? photo.RecommendedExposureIndex;
        if (typeof isoVal === 'number' && isoVal > 0) {
          exif.iso = isoVal;
        }

        const rawDate = photo.DateTimeOriginal || photo.DateTimeDigitized || img.DateTime;
        const offset =
          typeof photo.OffsetTimeOriginal === 'string' ? photo.OffsetTimeOriginal.trim() : undefined;
        exif.capturedAt = formatCapturedAt(rawDate, offset);
      }
    } catch {
      /* ignore malformed exif */
    }
    exifCache.set(imageUrl, exif);
  }

  let thumb = cachedThumb;
  if (wantThumbWidth && !thumb) {
    const out = await sharp(buf)
      .rotate() // auto-orient via EXIF
      .resize({ width: wantThumbWidth, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    thumb = new Uint8Array(out);
    if (thumbCache.size >= MAX_THUMB_CACHE) {
      const oldest = thumbCache.keys().next().value;
      if (oldest) thumbCache.delete(oldest);
    }
    thumbCache.set(thumbKey, thumb);
  }

  return { exif, thumb };
}

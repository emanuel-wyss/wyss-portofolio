type CacheEntry<T> = {
  data: T;
  ts: number;
};

type SWROptions<T> = {
  cacheKey?: string;
  maxAgeMs?: number;
  staleMs?: number;
  timeoutMs?: number;
  onUpdate?: (data: T) => void;
};

const inflight = new Map<string, Promise<unknown>>();

function getStorageKey(key: string): string {
  return `swr:${key}`;
}

function readCache<T>(key: string): CacheEntry<T> | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(getStorageKey(key));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (typeof parsed?.ts !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;

  try {
    const entry: CacheEntry<T> = { data, ts: Date.now() };
    window.localStorage.setItem(getStorageKey(key), JSON.stringify(entry));
  } catch {
    // Ignore storage quota / serialization errors.
  }
}

async function fetchJsonWithTimeout<T>(url: string, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!res.ok) {
      throw new Error(`Request failed: ${res.status}`);
    }

    return (await res.json()) as T;
  } finally {
    window.clearTimeout(timeout);
  }
}

function triggerRevalidation<T>(
  url: string,
  key: string,
  timeoutMs: number,
  onUpdate?: (data: T) => void,
): void {
  if (inflight.has(key)) return;

  const task = (async () => {
    try {
      const fresh = await fetchJsonWithTimeout<T>(url, timeoutMs);
      writeCache(key, fresh);
      onUpdate?.(fresh);
      return fresh;
    } catch {
      return null;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, task);
}

export async function fetchJsonSWR<T>(
  url: string,
  {
    cacheKey = url,
    maxAgeMs = 60_000,
    staleMs = 5 * 60_000,
    timeoutMs = 7_000,
    onUpdate,
  }: SWROptions<T> = {},
): Promise<T> {
  const now = Date.now();
  const cached = readCache<T>(cacheKey);

  if (cached) {
    const age = now - cached.ts;

    if (age <= maxAgeMs) {
      return cached.data;
    }

    if (age <= staleMs) {
      triggerRevalidation<T>(url, cacheKey, timeoutMs, onUpdate);
      return cached.data;
    }
  }

  try {
    const fresh = await fetchJsonWithTimeout<T>(url, timeoutMs);
    writeCache(cacheKey, fresh);
    return fresh;
  } catch (error) {
    if (cached) {
      triggerRevalidation<T>(url, cacheKey, timeoutMs, onUpdate);
      return cached.data;
    }
    throw error;
  }
}

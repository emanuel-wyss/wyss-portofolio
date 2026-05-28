import { fetchJsonSWR } from '@lib/clientFetchCache';
import { getCurrentSeason, getCurrentSpecialEvent, isDaytime, type WeatherType } from '@lib/theme';

type FeedItemType = 'post' | 'snippet' | 'gallery';

type FeedItem = {
  type: FeedItemType;
  id: string;
  title: string;
  slug: string;
  description: string;
  publishedAt: string;
  category?: string;
  language?: string;
  imageCount?: number;
};

type FeedResponse = {
  items: FeedItem[];
  totalDocs: number;
  totalPages: number;
  page: number;
  hasNextPage: boolean;
};

const WEATHER_LABELS: Record<WeatherType, string> = {
  sunny: '☀️ Sunny',
  cloudy: '☁️ Cloudy',
  rainy: '🌧️ Rainy',
  foggy: '🌫️ Foggy',
  stormy: '⛈️ Stormy',
  windy: '💨 Windy',
  snowy: '❄️ Snowy',
};

const SEASON_LABELS: Record<string, string> = {
  spring: '🌱 Spring',
  summer: '🌻 Summer',
  autumn: '🍂 Autumn',
  winter: '❄️ Winter',
};

const SPECIAL_LABELS: Record<string, string> = {
  christmas: '🎄 Christmas',
  easter: '🐣 Easter',
  halloween: '🎃 Halloween',
  newyear: '🎆 New Year',
  valentines: "💝 Valentine's",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getFeedCardHtml(item: FeedItem, index = 0): string {
  const typeLabel =
    item.type === 'post' ? '📝 Post' : item.type === 'snippet' ? '💻 Snippet' : '📸 Gallery';
  const href =
    item.type === 'post'
      ? `/posts/${item.slug}`
      : item.type === 'snippet'
        ? `/snippets/${item.slug}`
        : `/gallery/${item.slug}`;
  const linkText =
    item.type === 'post'
      ? 'Read More'
      : item.type === 'snippet'
        ? 'View Snippet'
        : 'View Album';

  let metaHtml = '';
  if (item.category) metaHtml += `<span class="category">${escapeHtml(item.category)}</span>`;
  if (item.language) metaHtml += `<span class="category">${escapeHtml(item.language)}</span>`;
  metaHtml += `<span class="date">${new Date(item.publishedAt).toLocaleDateString()}</span>`;

  return `
    <article class="card" style="animation-delay: ${index * 100}ms">
      <span class="type-badge type-${item.type}">${typeLabel}</span>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.description || '')}</p>
      <div class="meta">${metaHtml}</div>
      <a href="${href}" class="read-more">${linkText} →</a>
    </article>
  `;
}

class SiteMenu extends HTMLElement {
  connectedCallback(): void {
    const path = window.location.pathname;
    this.innerHTML = `
      <header class="nav">
        <div class="nav-inner">
          <a href="/" class="logo" aria-label="Home">WYSS</a>
          <nav aria-label="Main navigation">
            <a href="/about" class="nav-link ${path === '/about' ? 'active' : ''}">About</a>
            <a href="/work" class="nav-link ${path === '/work' ? 'active' : ''}">Work</a>
          </nav>
        </div>
      </header>
      <style>
        site-menu { display: block; }
        .nav {
          position: sticky;
          top: 0;
          z-index: var(--z-sticky);
          border-bottom: 1px solid var(--border-color);
          background: var(--bg-primary);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 var(--spacing-lg);
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .logo {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.125rem;
          letter-spacing: 0.12em;
          color: var(--text-primary);
          text-decoration: none;
          transition: opacity 0.2s ease;
        }
        .logo:hover {
          opacity: 0.65;
          color: var(--text-primary);
        }
        nav { display: flex; gap: var(--spacing-lg); }
        .nav-link {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-secondary);
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .nav-link:hover,
        .nav-link.active {
          color: var(--text-primary);
        }
        @media (max-width: 768px) {
          .nav-inner { padding: 0 var(--spacing-md); }
          nav { gap: var(--spacing-md); }
        }
      </style>
    `;
  }
}

class SiteFooter extends HTMLElement {
  async connectedCallback(): Promise<void> {
    const defaults = {
      tagline: 'Building beautiful, functional web experiences',
      social_links: [
        { platform: 'github', url: 'https://github.com' },
        { platform: 'twitter', url: 'https://twitter.com' },
        { platform: 'linkedin', url: 'https://linkedin.com' },
      ],
      cv_url: '',
    };

    let config = defaults;
    try {
      const res = await fetch('/api/site-config');
      if (res.ok) {
        const data = await res.json();
        if (data?.config) {
          config = {
            ...defaults,
            ...data.config,
          };
        }
      }
    } catch {
      // Keep fallback values.
    }

    const socialLinksHtml = (config.social_links || [])
      .map((link: { platform: string; url: string }) => {
        const label = `→ ${link.platform.charAt(0).toUpperCase()}${link.platform.slice(1)}`;
        return `<a href="${link.url}" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="${link.platform}">${label}</a>`;
      })
      .join('');

    const cvHtml = config.cv_url
      ? `<div class="footer-section"><a href="${config.cv_url}" class="cv-link" download>→ Download CV</a></div>`
      : '';

    this.innerHTML = `
      <footer class="footer">
        <div class="footer-content">
          <div class="footer-section">
            <p class="copyright">© ${new Date().getFullYear()} Wyss. All rights reserved.</p>
          </div>
          <div class="footer-section social-links">
            <nav class="socials" aria-label="Social links">${socialLinksHtml}</nav>
          </div>
          ${cvHtml}
          <div class="footer-section theme-info">
            <p class="theme-info-title">Current theme:</p>
            <ul class="theme-info-list">
              <li id="footer-weather"></li>
              <li id="footer-daytime"></li>
              <li id="footer-season"></li>
            </ul>
          </div>
        </div>
        <div class="footer-divider"></div>
        <div class="footer-bottom">
          <p class="tagline">${escapeHtml(config.tagline || defaults.tagline)}</p>
        </div>
      </footer>
      <style>
        site-footer { display: block; }
        .footer {
          border-top: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
          padding: 4rem 2rem 2rem;
          margin-top: 8rem;
          background: var(--footer-bg, rgba(255, 255, 255, 0.5));
          backdrop-filter: blur(10px);
        }
        .footer-content {
          max-width: 1200px;
          margin: 0 auto 2rem;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 2rem;
        }
        .copyright,
        .theme-info-title,
        .theme-info-list,
        .tagline {
          font-size: 0.875rem;
          color: var(--text-secondary, rgba(0, 0, 0, 0.6));
          margin: 0;
        }
        .socials {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .social-link {
          color: var(--text-primary, #000);
          text-decoration: none;
          font-size: 0.95rem;
          padding: 0.5rem 0;
          transition: all 0.3s ease;
        }
        .social-link:hover { color: var(--accent, #0066ff); }
        .cv-link {
          color: var(--text-primary, #000);
          text-decoration: none;
          font-size: 0.95rem;
          padding: 0.5rem;
          border: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
          border-radius: 4px;
          display: inline-block;
          transition: all 0.3s ease;
        }
        .cv-link:hover {
          background: var(--accent, #0066ff);
          color: #fff;
          border-color: var(--accent, #0066ff);
        }
        .theme-info-list {
          list-style: none;
          padding: 0;
          margin-top: 0.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .footer-divider {
          height: 1px;
          background: var(--border-color, rgba(0, 0, 0, 0.1));
          margin: 2rem 0;
        }
        .footer-bottom { text-align: center; }
        @media (max-width: 768px) {
          .footer { padding: 2rem 1rem 1rem; margin-top: 4rem; }
          .footer-content { grid-template-columns: 1fr; gap: 1rem; }
        }
      </style>
    `;

    this.updateThemeInfo();
  }

  private updateThemeInfo(): void {
    const weatherEl = this.querySelector('#footer-weather');
    const daytimeEl = this.querySelector('#footer-daytime');
    const seasonEl = this.querySelector('#footer-season');

    const weatherClass = Array.from(document.documentElement.classList).find((cls) =>
      cls.startsWith('weather-')
    );
    const weatherKey = weatherClass?.replace('weather-', '') as WeatherType | undefined;
    const weather = weatherKey && WEATHER_LABELS[weatherKey] ? WEATHER_LABELS[weatherKey] : '☀️ Sunny';

    if (weatherEl) weatherEl.textContent = `weather: ${weather}`;
    if (daytimeEl) daytimeEl.textContent = `daytime: ${isDaytime() ? '☀️ day' : '🌙 night'}`;
    if (seasonEl) {
      const season = getCurrentSeason();
      const special = getCurrentSpecialEvent();
      seasonEl.textContent = `season: ${special ? SPECIAL_LABELS[special] : SEASON_LABELS[season]}`;
    }
  }
}

class ContentFeed extends HTMLElement {
  private currentPage = 1;
  private currentType: FeedItemType | 'all' = 'all';
  private hasNextPage = false;
  private grid: HTMLElement | null = null;
  private loadMoreBtn: HTMLButtonElement | null = null;
  private emptyState: HTMLElement | null = null;

  connectedCallback(): void {
    const mode = this.getAttribute('mode') === 'work' ? 'work' : 'latest';
    this.currentType = (this.getAttribute('type') as FeedItemType | 'all') || 'all';
    this.renderShell(mode);
    this.attachListeners(mode);
    this.loadPage(1, this.currentType, false);
  }

  private getLimit(): number {
    const raw = Number(this.getAttribute('limit') || 12);
    return Number.isFinite(raw) && raw > 0 ? raw : 12;
  }

  private getCachePrefix(mode: 'latest' | 'work'): string {
    return this.getAttribute('cache-key') || `feed:${mode}:v1`;
  }

  private renderShell(mode: 'latest' | 'work'): void {
    const workTabs =
      mode === 'work'
        ? `
      <nav class="filter-tabs" aria-label="Content type filter">
        <button class="tab active" data-type="all">All</button>
        <button class="tab" data-type="post">Posts</button>
        <button class="tab" data-type="snippet">Snippets</button>
        <button class="tab" data-type="gallery">Galleries</button>
      </nav>
    `
        : '';

    const workLoadMore =
      mode === 'work'
        ? `<button class="btn btn-load-more" id="load-more" style="display: none;">Load More</button>`
        : '';

    this.innerHTML = `
      ${workTabs}
      <div class="grid grid-3 feed-grid" id="feed-grid">
        <p class="loading">Loading...</p>
      </div>
      ${workLoadMore}
      <div class="empty-state" id="empty-state" style="display: none;">
        <p>No content found.</p>
      </div>
      <style>
        content-feed { display: block; }
        .filter-tabs {
          display: flex;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-xl);
          flex-wrap: wrap;
        }
        .tab {
          padding: 0.5rem 1.25rem;
          border: 1px solid var(--border-color);
          border-radius: 20px;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          font-family: inherit;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        .tab:hover {
          border-color: var(--accent);
          color: var(--accent);
        }
        .tab.active {
          background: var(--accent);
          border-color: var(--accent);
          color: white;
        }
        .card {
          padding: var(--spacing-lg);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          transition: all 0.3s ease;
          animation: slideInRight 0.6s ease-out backwards;
        }
        .card:hover {
          transform: translateY(-8px);
          border-color: var(--accent);
          box-shadow: 0 20px 40px rgba(0, 102, 255, 0.1);
        }
        .card h3 {
          margin-bottom: var(--spacing-sm);
          font-size: 1.25rem;
        }
        .card p {
          margin-bottom: var(--spacing-md);
          color: var(--text-secondary);
        }
        .type-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: var(--spacing-sm);
        }
        .type-post {
          background: var(--accent-light);
          color: var(--accent);
        }
        .type-snippet {
          background: rgba(76, 175, 80, 0.15);
          color: #4caf50;
        }
        .type-gallery {
          background: rgba(255, 152, 0, 0.15);
          color: #ff9800;
        }
        .meta {
          display: flex;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-md);
          font-size: 0.875rem;
          flex-wrap: wrap;
        }
        .category {
          background: var(--accent-light);
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          color: var(--accent);
          font-weight: 500;
        }
        .date { color: var(--text-secondary); }
        .read-more {
          color: var(--accent);
          font-weight: 500;
          transition: all 0.3s ease;
        }
        .btn-load-more {
          display: block;
          margin: var(--spacing-xl) auto 0;
          padding: var(--spacing-md) var(--spacing-xl);
          border: 2px solid var(--accent);
          border-radius: 8px;
          background: transparent;
          color: var(--accent);
          font-family: inherit;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .btn-load-more:hover {
          background: var(--accent);
          color: white;
        }
        .empty-state {
          text-align: center;
          padding: var(--spacing-2xl);
          color: var(--text-secondary);
        }
      </style>
    `;

    this.grid = this.querySelector('#feed-grid');
    this.loadMoreBtn = this.querySelector('#load-more');
    this.emptyState = this.querySelector('#empty-state');
  }

  private attachListeners(mode: 'latest' | 'work'): void {
    if (mode === 'work') {
      const tabs = this.querySelectorAll<HTMLButtonElement>('.tab');
      tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
          tabs.forEach((t) => t.classList.remove('active'));
          tab.classList.add('active');
          this.currentType = (tab.dataset.type as FeedItemType | 'all') || 'all';
          this.currentPage = 1;
          this.loadPage(1, this.currentType, false);
        });
      });

      this.loadMoreBtn?.addEventListener('click', () => {
        this.loadPage(this.currentPage + 1, this.currentType, true);
      });
    }
  }

  private renderFeedResult(data: FeedResponse, append = false): void {
    if (!this.grid || !this.emptyState) return;
    if (!append) this.grid.innerHTML = '';

    if (data.items.length === 0 && !append) {
      this.emptyState.style.display = 'block';
    } else {
      this.emptyState.style.display = 'none';
    }

    if (data.items.length > 0) {
      const startIndex = append ? this.grid.children.length : 0;
      this.grid.insertAdjacentHTML(
        'beforeend',
        data.items.map((item, i) => getFeedCardHtml(item, startIndex + i)).join('')
      );
    }

    this.currentPage = data.page;
    this.hasNextPage = data.hasNextPage;
    if (this.loadMoreBtn) {
      this.loadMoreBtn.style.display = this.hasNextPage ? 'block' : 'none';
    }
  }

  private async fetchFeed(page: number, type: FeedItemType | 'all'): Promise<FeedResponse> {
    const mode = this.getAttribute('mode') === 'work' ? 'work' : 'latest';
    const params = new URLSearchParams({
      page: String(page),
      limit: String(this.getLimit()),
      type,
    });

    return fetchJsonSWR<FeedResponse>(`/api/feed?${params}`, {
      cacheKey: `${this.getCachePrefix(mode)}:${type}:${page}`,
      maxAgeMs: 60_000,
      staleMs: 10 * 60_000,
      timeoutMs: 7_000,
      onUpdate:
        page === 1
          ? (fresh) => {
              if (type === this.currentType && this.currentPage <= 1) {
                this.renderFeedResult(fresh, false);
              }
            }
          : undefined,
    });
  }

  private async loadPage(page: number, type: FeedItemType | 'all', append = false): Promise<void> {
    try {
      const data = await this.fetchFeed(page, type);
      this.renderFeedResult(data, append);
    } catch {
      if (!append && this.grid) {
        this.grid.innerHTML = '<p class="empty">Could not load content.</p>';
      }
    }
  }
}

if (!customElements.get('site-menu')) {
  customElements.define('site-menu', SiteMenu);
}

if (!customElements.get('site-footer')) {
  customElements.define('site-footer', SiteFooter);
}

if (!customElements.get('content-feed')) {
  customElements.define('content-feed', ContentFeed);
}

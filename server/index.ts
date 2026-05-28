import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { getPayload } from 'payload';
import type { Payload } from 'payload';
import payloadConfig from './payload/config';
import { renderPage, lexicalToHtml } from './render';

// Initialize app
const app = new Hono();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: (origin) => {
      const allowedOrigins = [
        'https://wyss.rocks',
        'https://www.wyss.rocks',
        'https://web-production-3e6e0.up.railway.app',
        'http://localhost:3000',
      ];
      return allowedOrigins.includes(origin || '') ? origin : 'https://wyss.rocks';
    },
    credentials: true,
  })
);

// API cache policy to complement client-side SWR.
app.use('/api/*', async (c, next) => {
  await next();

  // Cache only successful responses and keep explicit per-route overrides intact.
  if (c.res.status < 200 || c.res.status >= 300 || c.res.headers.has('Cache-Control')) {
    return;
  }

  const path = c.req.path;
  let cacheControl = 'public, max-age=120, stale-while-revalidate=600';

  if (path === '/api/feed') {
    cacheControl = 'public, max-age=60, stale-while-revalidate=300';
  } else if (path === '/api/site-config') {
    cacheControl = 'public, max-age=300, stale-while-revalidate=3600';
  } else if (path.startsWith('/api/posts/') || path.startsWith('/api/snippets/') || path.startsWith('/api/gallery/')) {
    cacheControl = 'public, max-age=180, stale-while-revalidate=900';
  }

  c.res.headers.set('Cache-Control', cacheControl);
  c.res.headers.set('Vary', 'Accept-Encoding');
});

// Initialize Payload
let payloadInstance: Payload | null = null;

async function initPayload(): Promise<Payload> {
  if (!payloadInstance) {
    payloadInstance = await getPayload({ config: payloadConfig });
  }
  return payloadInstance;
}

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Posts API
app.get('/api/posts', async (c) => {
  const payload = await initPayload();
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = parseInt(c.req.query('limit') || '100', 10);
  
  try {
    const posts = await payload.find({
      collection: 'posts',
      page,
      limit,
      sort: '-publishedAt',
    });

    return c.json({
      success: true,
      count: posts.docs.length,
      totalDocs: posts.totalDocs,
      totalPages: posts.totalPages,
      page: posts.page,
      hasNextPage: posts.hasNextPage,
      posts: posts.docs.map((post: any) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        category: post.category,
        tags: post.tags || [],
        publishedAt: post.publishedAt,
        featured_image: post.featured_image?.url,
        seo: post.seo,
      })),
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return c.json({ success: false, error: 'Failed to fetch posts' }, 500);
  }
});

app.get('/api/posts/:slug', async (c) => {
  const payload = await initPayload();
  const { slug } = c.req.param();

  try {
    const posts = await payload.find({
      collection: 'posts',
      where: {
        slug: { equals: slug },
      },
    });

    if (posts.docs.length === 0) {
      return c.json({ success: false, error: 'Post not found' }, 404);
    }

    const post = posts.docs[0];
    return c.json({
      success: true,
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        category: post.category,
        tags: post.tags || [],
        publishedAt: post.publishedAt,
        updatedAt: post.updatedAt,
        featured_image: post.featured_image?.url,
        seo: post.seo,
      },
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    return c.json({ success: false, error: 'Failed to fetch post' }, 500);
  }
});

// Gallery API
app.get('/api/gallery', async (c) => {
  const payload = await initPayload();
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = parseInt(c.req.query('limit') || '50', 10);

  try {
    const albums = await payload.find({
      collection: 'gallery',
      page,
      limit,
      sort: '-publishedAt',
    });

    return c.json({
      success: true,
      count: albums.docs.length,
      totalDocs: albums.totalDocs,
      totalPages: albums.totalPages,
      page: albums.page,
      hasNextPage: albums.hasNextPage,
      albums: albums.docs.map((album: any) => ({
        id: album.id,
        title: album.title,
        slug: album.slug,
        album: album.album,
        description: album.description,
        imageCount: album.images?.length || 0,
        publishedAt: album.publishedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching gallery:', error);
    return c.json({ success: false, error: 'Failed to fetch gallery' }, 500);
  }
});

app.get('/api/gallery/:slug', async (c) => {
  const payload = await initPayload();
  const { slug } = c.req.param();

  try {
    const albums = await payload.find({
      collection: 'gallery',
      where: {
        slug: { equals: slug },
      },
    });

    if (albums.docs.length === 0) {
      return c.json({ success: false, error: 'Album not found' }, 404);
    }

    const album = albums.docs[0];
    return c.json({
      success: true,
      album: {
        id: album.id,
        title: album.title,
        slug: album.slug,
        description: album.description,
        images: album.images?.map((img: any) => ({
          id: img.image.id,
          url: img.image.url,
          alt: img.image.alt,
          caption: img.image.caption,
          order: img.order,
        })) || [],
        publishedAt: album.publishedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching album:', error);
    return c.json({ success: false, error: 'Failed to fetch album' }, 500);
  }
});

// Snippets API
app.get('/api/snippets', async (c) => {
  const payload = await initPayload();
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = parseInt(c.req.query('limit') || '100', 10);

  try {
    const snippets = await payload.find({
      collection: 'snippets',
      page,
      limit,
      sort: '-publishedAt',
    });

    return c.json({
      success: true,
      count: snippets.docs.length,
      totalDocs: snippets.totalDocs,
      totalPages: snippets.totalPages,
      page: snippets.page,
      hasNextPage: snippets.hasNextPage,
      snippets: snippets.docs.map((snippet: any) => ({
        id: snippet.id,
        title: snippet.title,
        slug: snippet.slug,
        description: snippet.description,
        language: snippet.language,
        category: snippet.category,
        tags: snippet.tags || [],
        publishedAt: snippet.publishedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching snippets:', error);
    return c.json({ success: false, error: 'Failed to fetch snippets' }, 500);
  }
});

app.get('/api/snippets/:slug', async (c) => {
  const payload = await initPayload();
  const { slug } = c.req.param();

  try {
    const snippets = await payload.find({
      collection: 'snippets',
      where: {
        slug: { equals: slug },
      },
    });

    if (snippets.docs.length === 0) {
      return c.json({ success: false, error: 'Snippet not found' }, 404);
    }

    const snippet = snippets.docs[0];
    return c.json({
      success: true,
      snippet: {
        id: snippet.id,
        title: snippet.title,
        slug: snippet.slug,
        description: snippet.description,
        code: snippet.code,
        language: snippet.language,
        category: snippet.category,
        tags: snippet.tags || [],
        publishedAt: snippet.publishedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching snippet:', error);
    return c.json({ success: false, error: 'Failed to fetch snippet' }, 500);
  }
});

// Unified Feed API (merged content types with filtering + pagination)
app.get('/api/feed', async (c) => {
  const payload = await initPayload();
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = parseInt(c.req.query('limit') || '12', 10);
  const type = c.req.query('type') || 'all';

  try {
    type FeedItem = {
      type: 'post' | 'snippet' | 'gallery';
      id: string;
      title: string;
      slug: string;
      description: string;
      publishedAt: string;
      category?: string;
      language?: string;
      tags?: string[];
      imageCount?: number;
      featured_image?: string;
    };

    const items: FeedItem[] = [];

    // Fetch from relevant collections
    if (type === 'all' || type === 'post') {
      const posts = await payload.find({
        collection: 'posts',
        limit: 100,
        sort: '-publishedAt',
      });
      items.push(
        ...posts.docs.map((p: any) => ({
          type: 'post' as const,
          id: p.id,
          title: p.title,
          slug: p.slug,
          description: p.excerpt || '',
          publishedAt: p.publishedAt,
          category: p.category,
          tags: p.tags || [],
          featured_image: p.featured_image?.url,
        }))
      );
    }

    if (type === 'all' || type === 'snippet') {
      const snippets = await payload.find({
        collection: 'snippets',
        limit: 100,
        sort: '-publishedAt',
      });
      items.push(
        ...snippets.docs.map((s: any) => ({
          type: 'snippet' as const,
          id: s.id,
          title: s.title,
          slug: s.slug,
          description: s.description || '',
          publishedAt: s.publishedAt,
          category: s.category,
          language: s.language,
          tags: s.tags || [],
        }))
      );
    }

    if (type === 'all' || type === 'gallery') {
      const albums = await payload.find({
        collection: 'gallery',
        limit: 100,
        sort: '-publishedAt',
      });
      items.push(
        ...albums.docs.map((a: any) => ({
          type: 'gallery' as const,
          id: a.id,
          title: a.title,
          slug: a.slug,
          description: a.description || '',
          publishedAt: a.publishedAt,
          imageCount: a.images?.length || 0,
        }))
      );
    }

    // Sort merged results by publishedAt descending
    items.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // Paginate
    const totalDocs = items.length;
    const totalPages = Math.ceil(totalDocs / limit);
    const start = (page - 1) * limit;
    const paged = items.slice(start, start + limit);

    return c.json({
      success: true,
      items: paged,
      totalDocs,
      totalPages,
      page,
      hasNextPage: page < totalPages,
    });
  } catch (error) {
    console.error('Error fetching feed:', error);
    return c.json({ success: false, error: 'Failed to fetch feed' }, 500);
  }
});

// Site Config API
app.get('/api/site-config', async (c) => {
  const payload = await initPayload();

  try {
    const config = await payload.find({
      collection: 'site-config',
      limit: 1,
    });

    if (config.docs.length === 0) {
      return c.json({ success: false, error: 'Site config not found' }, 404);
    }

    const siteConfig = config.docs[0];
    return c.json({
      success: true,
      config: {
        siteName: siteConfig.siteName,
        tagline: siteConfig.tagline,
        description: siteConfig.description,
        social_links: siteConfig.social_links || [],
        cv_url: siteConfig.cv_url?.url,
        seo: siteConfig.seo,
      },
    });
  } catch (error) {
    console.error('Error fetching site config:', error);
    return c.json({ success: false, error: 'Failed to fetch site config' }, 500);
  }
});

// ---------------------------------------------------------------------------
// Detail pages (server-rendered HTML)
// ---------------------------------------------------------------------------

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Post detail page
app.get('/posts/:slug', async (c) => {
  const payload = await initPayload();
  const { slug } = c.req.param();

  try {
    const posts = await payload.find({
      collection: 'posts',
      where: { slug: { equals: slug } },
    });

    if (posts.docs.length === 0) {
      return c.notFound();
    }

    const post = posts.docs[0] as any;
    const contentHtml = lexicalToHtml(post.content);
    const publishedAt = post.publishedAt
      ? new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : '';
    const tags = (post.tags || []).map((t: any) => t.tag || t).filter(Boolean);

    const mainHtml = `
      <article class="detail-page">
        <div class="container">
          <a href="/work" class="back-link">← Back to Work</a>
          ${post.featured_image?.url ? `<img src="${escapeAttr(post.featured_image.url)}" alt="${escapeAttr(post.title)}" class="featured-image">` : ''}
          <header class="detail-header">
            <h1>${escapeAttr(post.title)}</h1>
            <div class="detail-meta">
              ${post.category ? `<span class="category">${escapeAttr(post.category)}</span>` : ''}
              ${publishedAt ? `<time>${publishedAt}</time>` : ''}
            </div>
            ${tags.length ? `<div class="tags">${tags.map((t: string) => `<span class="tag">${escapeAttr(t)}</span>`).join('')}</div>` : ''}
          </header>
          <div class="prose">${contentHtml}</div>
        </div>
      </article>
      <style>
        .detail-page { padding: var(--spacing-xl) 0; }
        .back-link { display: inline-block; margin-bottom: var(--spacing-lg); font-size: 0.9rem; color: var(--text-secondary); }
        .back-link:hover { color: var(--text-primary); }
        .featured-image { width: 100%; max-height: 480px; object-fit: cover; border-radius: 12px; margin-bottom: var(--spacing-xl); }
        .detail-header { margin-bottom: var(--spacing-xl); }
        .detail-header h1 { font-size: 2.5rem; margin-bottom: var(--spacing-sm); }
        .detail-meta { display: flex; gap: var(--spacing-md); align-items: center; color: var(--text-secondary); font-size: 0.9rem; margin-bottom: var(--spacing-sm); }
        .category { background: var(--accent-light); color: var(--accent); padding: 0.2em 0.6em; border-radius: 4px; font-size: 0.8rem; font-weight: 500; }
        .tags { display: flex; gap: var(--spacing-sm); flex-wrap: wrap; }
        .tag { background: var(--bg-secondary); padding: 0.2em 0.6em; border-radius: 4px; font-size: 0.8rem; color: var(--text-secondary); }
        .prose { max-width: 720px; line-height: 1.8; }
        .prose h2 { margin-top: var(--spacing-xl); }
        .prose h3 { margin-top: var(--spacing-lg); }
        .prose p { margin-bottom: var(--spacing-md); }
        .prose ul, .prose ol { margin-bottom: var(--spacing-md); padding-left: var(--spacing-lg); }
        .prose li { margin-bottom: var(--spacing-xs); color: var(--text-secondary); }
        .prose blockquote { border-left: 3px solid var(--accent); padding-left: var(--spacing-md); margin: var(--spacing-lg) 0; color: var(--text-secondary); font-style: italic; }
        .prose pre { background: var(--bg-secondary); padding: var(--spacing-lg); border-radius: 8px; overflow-x: auto; margin-bottom: var(--spacing-lg); }
        .prose pre code { padding: 0; background: transparent; font-size: 0.875rem; }
        .prose img { max-width: 100%; border-radius: 8px; margin: var(--spacing-lg) 0; }
        .prose hr { border: none; border-top: 1px solid var(--border-color); margin: var(--spacing-xl) 0; }
        @media (max-width: 768px) { .detail-header h1 { font-size: 1.75rem; } }
      </style>`;

    const html = await renderPage(
      post.title,
      post.excerpt || '',
      mainHtml,
    );
    return c.html(html);
  } catch (error) {
    console.error('Error rendering post page:', error);
    return c.notFound();
  }
});

// Snippet detail page
app.get('/snippets/:slug', async (c) => {
  const payload = await initPayload();
  const { slug } = c.req.param();

  try {
    const snippets = await payload.find({
      collection: 'snippets',
      where: { slug: { equals: slug } },
    });

    if (snippets.docs.length === 0) {
      return c.notFound();
    }

    const snippet = snippets.docs[0] as any;
    const publishedAt = snippet.publishedAt
      ? new Date(snippet.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : '';
    const tags = (snippet.tags || []).map((t: any) => t.tag || t).filter(Boolean);

    const mainHtml = `
      <article class="detail-page">
        <div class="container">
          <a href="/work" class="back-link">← Back to Work</a>
          <header class="detail-header">
            <h1>${escapeAttr(snippet.title)}</h1>
            <div class="detail-meta">
              ${snippet.language ? `<span class="category">${escapeAttr(snippet.language)}</span>` : ''}
              ${snippet.category ? `<span class="category">${escapeAttr(snippet.category)}</span>` : ''}
              ${publishedAt ? `<time>${publishedAt}</time>` : ''}
            </div>
            ${tags.length ? `<div class="tags">${tags.map((t: string) => `<span class="tag">${escapeAttr(t)}</span>`).join('')}</div>` : ''}
            ${snippet.description ? `<p class="description">${escapeAttr(snippet.description)}</p>` : ''}
          </header>
          <div class="code-block">
            <div class="code-header">
              <span class="code-lang">${escapeAttr(snippet.language || 'text')}</span>
              <button class="copy-btn" onclick="navigator.clipboard.writeText(document.querySelector('.code-block code').textContent)">Copy</button>
            </div>
            <pre><code class="language-${escapeAttr(snippet.language || 'text')}">${escapeAttr(snippet.code || '')}</code></pre>
          </div>
        </div>
      </article>
      <style>
        .detail-page { padding: var(--spacing-xl) 0; }
        .back-link { display: inline-block; margin-bottom: var(--spacing-lg); font-size: 0.9rem; color: var(--text-secondary); }
        .back-link:hover { color: var(--text-primary); }
        .detail-header { margin-bottom: var(--spacing-xl); }
        .detail-header h1 { font-size: 2.5rem; margin-bottom: var(--spacing-sm); }
        .detail-meta { display: flex; gap: var(--spacing-md); align-items: center; color: var(--text-secondary); font-size: 0.9rem; margin-bottom: var(--spacing-sm); }
        .category { background: var(--accent-light); color: var(--accent); padding: 0.2em 0.6em; border-radius: 4px; font-size: 0.8rem; font-weight: 500; }
        .tags { display: flex; gap: var(--spacing-sm); flex-wrap: wrap; margin-bottom: var(--spacing-sm); }
        .tag { background: var(--bg-secondary); padding: 0.2em 0.6em; border-radius: 4px; font-size: 0.8rem; color: var(--text-secondary); }
        .description { color: var(--text-secondary); font-size: 1.05rem; margin-top: var(--spacing-sm); }
        .code-block { border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; }
        .code-header { display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-sm) var(--spacing-md); background: var(--bg-secondary); border-bottom: 1px solid var(--border-color); }
        .code-lang { font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
        .copy-btn { font-family: var(--font-body); font-size: 0.8rem; padding: 0.3em 0.8em; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-primary); color: var(--text-secondary); cursor: pointer; }
        .copy-btn:hover { color: var(--text-primary); border-color: var(--text-secondary); }
        .code-block pre { margin: 0; border-radius: 0; padding: var(--spacing-lg); background: var(--bg-secondary); overflow-x: auto; }
        .code-block pre code { font-size: 0.875rem; line-height: 1.7; background: transparent; padding: 0; }
        @media (max-width: 768px) { .detail-header h1 { font-size: 1.75rem; } }
      </style>`;

    const html = await renderPage(
      snippet.title,
      snippet.description || '',
      mainHtml,
    );
    return c.html(html);
  } catch (error) {
    console.error('Error rendering snippet page:', error);
    return c.notFound();
  }
});

// Gallery detail page
app.get('/gallery/:slug', async (c) => {
  const payload = await initPayload();
  const { slug } = c.req.param();

  try {
    const albums = await payload.find({
      collection: 'gallery',
      where: { slug: { equals: slug } },
    });

    if (albums.docs.length === 0) {
      return c.notFound();
    }

    const album = albums.docs[0] as any;
    const images = (album.images || [])
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
      .map((img: any) => ({
        url: img.image?.url || '',
        alt: img.image?.alt || album.title,
        caption: img.image?.caption || '',
      }))
      .filter((img: any) => img.url);

    const mainHtml = `
      <article class="detail-page">
        <div class="container">
          <a href="/work" class="back-link">← Back to Work</a>
          <header class="detail-header">
            <h1>${escapeAttr(album.title)}</h1>
            ${album.album ? `<p class="album-name">${escapeAttr(album.album)}</p>` : ''}
            ${album.description ? `<p class="description">${escapeAttr(album.description)}</p>` : ''}
          </header>
          <div class="gallery-grid">
            ${images.map((img: any) => `
              <figure class="gallery-item">
                <img src="${escapeAttr(img.url)}" alt="${escapeAttr(img.alt)}" loading="lazy">
                ${img.caption ? `<figcaption>${escapeAttr(img.caption)}</figcaption>` : ''}
              </figure>
            `).join('')}
          </div>
        </div>
      </article>
      <style>
        .detail-page { padding: var(--spacing-xl) 0; }
        .back-link { display: inline-block; margin-bottom: var(--spacing-lg); font-size: 0.9rem; color: var(--text-secondary); }
        .back-link:hover { color: var(--text-primary); }
        .detail-header { margin-bottom: var(--spacing-xl); }
        .detail-header h1 { font-size: 2.5rem; margin-bottom: var(--spacing-sm); }
        .album-name { color: var(--text-secondary); font-size: 1.05rem; margin-bottom: var(--spacing-xs); }
        .description { color: var(--text-secondary); }
        .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--spacing-lg); }
        .gallery-item { margin: 0; }
        .gallery-item img { width: 100%; border-radius: 8px; display: block; transition: transform 0.3s ease; }
        .gallery-item img:hover { transform: scale(1.02); }
        .gallery-item figcaption { font-size: 0.85rem; color: var(--text-secondary); margin-top: var(--spacing-sm); text-align: center; }
        @media (max-width: 768px) { .detail-header h1 { font-size: 1.75rem; } .gallery-grid { grid-template-columns: 1fr; } }
      </style>`;

    const html = await renderPage(
      album.title,
      album.description || '',
      mainHtml,
    );
    return c.html(html);
  } catch (error) {
    console.error('Error rendering gallery page:', error);
    return c.notFound();
  }
});

// Serve static frontend assets for all other routes.
app.use('*', serveStatic({ root: './dist/public' }));

// SPA fallback: let TanStack Router handle unmatched frontend routes.
app.get('*', async (c) => {
  const indexFile = Bun.file('./dist/public/index.html');
  if (await indexFile.exists()) {
    return c.html(await indexFile.text());
  }

  return c.notFound();
});

// Error handling
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json(
    {
      success: false,
      error: err.message || 'Internal server error',
    },
    500
  );
});

// Start server
const PORT = parseInt(process.env.PORT || '3000', 10);

export default {
  port: PORT,
  fetch: app.fetch,
};

console.log(`Server starting on port ${PORT}`);

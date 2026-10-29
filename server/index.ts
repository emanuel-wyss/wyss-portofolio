import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { getPayload } from 'payload';
import type { Payload } from 'payload';
import payloadConfig from './payload/config';
import { lexicalToHtml } from './render';
import { getGitHubProfileCached } from './github';
import { getWeatherCached } from './weather';

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
  } else if (path === '/api/github') {
    cacheControl = 'public, max-age=1800, stale-while-revalidate=7200';
  } else if (path === '/api/weather') {
    cacheControl = 'public, max-age=1800, stale-while-revalidate=3600';
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

    const post = posts.docs[0] as any;
    return c.json({
      success: true,
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        contentHtml: lexicalToHtml(post.content),
        category: post.category,
        tags: (post.tags || []).map((t: any) => t.tag || t).filter(Boolean),
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
        friends_links: siteConfig.friends_links || [],
        cv_url: siteConfig.cv_url?.url,
        seo: siteConfig.seo,
      },
    });
  } catch (error) {
    console.error('Error fetching site config:', error);
    return c.json({ success: false, error: 'Failed to fetch site config' }, 500);
  }
});

// GitHub profile showcase (proxied + cached server-side)
app.get('/api/github', async (c) => {
  try {
    const profile = await getGitHubProfileCached();
    return c.json({ success: true, profile });
  } catch (error) {
    console.error('Error fetching GitHub profile:', error);
    return c.json({ success: false, error: 'Failed to fetch GitHub profile' }, 500);
  }
});

// Real weather for the dynamic theme (Open-Meteo, cached)
app.get('/api/weather', async (c) => {
  try {
    const weather = await getWeatherCached();
    return c.json({ success: true, weather });
  } catch (error) {
    console.error('Error fetching weather:', error);
    return c.json({ success: false, error: 'Failed to fetch weather' }, 500);
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

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { getPayload } from 'payload';
import type { Payload } from 'payload';
import payloadConfig from './payload/config';

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
        'http://localhost:3000',
      ];
      return allowedOrigins.includes(origin || '') ? origin : 'https://wyss.rocks';
    },
    credentials: true,
  })
);

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
  
  try {
    const posts = await payload.find({
      collection: 'posts',
      limit: 100,
      sort: '-publishedAt',
    });

    return c.json({
      success: true,
      count: posts.docs.length,
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

  try {
    const albums = await payload.find({
      collection: 'gallery',
      limit: 50,
      sort: '-publishedAt',
    });

    return c.json({
      success: true,
      count: albums.docs.length,
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

  try {
    const snippets = await payload.find({
      collection: 'snippets',
      limit: 100,
      sort: '-publishedAt',
    });

    return c.json({
      success: true,
      count: snippets.docs.length,
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

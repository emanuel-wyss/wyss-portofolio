// src/lib/api.ts

// In the browser, use relative URLs so the request hits the same origin (Hono server).
// During SSG build, fall back to the env var or localhost.
const API_BASE =
  typeof window !== 'undefined'
    ? ''
    : (import.meta.env.PUBLIC_API_URL || 'http://localhost:3000');

export function getApiUrl(): string {
  return API_BASE;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category?: string;
  tags?: string[];
  publishedAt: string;
  featured_image?: string;
  seo?: {
    metaDescription?: string;
    ogImage?: string;
  };
}

export interface PostDetail extends Post {
  content: any;
  updatedAt?: string;
}

export interface Album {
  id: string;
  title: string;
  slug: string;
  album?: string;
  description?: string;
  imageCount: number;
  publishedAt: string;
}

export interface AlbumDetail extends Album {
  images: Array<{
    id: string;
    url: string;
    alt: string;
    caption?: string;
    order?: number;
  }>;
}

export interface Snippet {
  id: string;
  title: string;
  slug: string;
  description: string;
  language: string;
  category?: string;
  tags?: string[];
  publishedAt: string;
}

export interface SnippetDetail extends Snippet {
  code: string;
}

export interface SiteConfig {
  siteName: string;
  tagline: string;
  description: string;
  social_links: Array<{
    platform: string;
    url: string;
    icon?: string;
  }>;
  cv_url?: string;
  seo?: {
    metaDescription: string;
    ogImage?: string;
    twitterHandle?: string;
  };
}

// Posts
export async function getPosts(): Promise<Post[]> {
  try {
    const response = await fetch(`${API_BASE}/api/posts`, {
      headers: { 'Cache-Control': 'max-age=3600' },
    });
    if (!response.ok) throw new Error('Failed to fetch posts');
    const data = await response.json();
    return data.posts || [];
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<PostDetail | null> {
  try {
    const response = await fetch(`${API_BASE}/api/posts/${slug}`);
    if (!response.ok) throw new Error('Post not found');
    const data = await response.json();
    return data.post || null;
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

// Gallery
export async function getAlbums(): Promise<Album[]> {
  try {
    const response = await fetch(`${API_BASE}/api/gallery`);
    if (!response.ok) throw new Error('Failed to fetch gallery');
    const data = await response.json();
    return data.albums || [];
  } catch (error) {
    console.error('Error fetching albums:', error);
    return [];
  }
}

export async function getAlbumBySlug(slug: string): Promise<AlbumDetail | null> {
  try {
    const response = await fetch(`${API_BASE}/api/gallery/${slug}`);
    if (!response.ok) throw new Error('Album not found');
    const data = await response.json();
    return data.album || null;
  } catch (error) {
    console.error('Error fetching album:', error);
    return null;
  }
}

// Snippets
export async function getSnippets(): Promise<Snippet[]> {
  try {
    const response = await fetch(`${API_BASE}/api/snippets`);
    if (!response.ok) throw new Error('Failed to fetch snippets');
    const data = await response.json();
    return data.snippets || [];
  } catch (error) {
    console.error('Error fetching snippets:', error);
    return [];
  }
}

export async function getSnippetBySlug(slug: string): Promise<SnippetDetail | null> {
  try {
    const response = await fetch(`${API_BASE}/api/snippets/${slug}`);
    if (!response.ok) throw new Error('Snippet not found');
    const data = await response.json();
    return data.snippet || null;
  } catch (error) {
    console.error('Error fetching snippet:', error);
    return null;
  }
}

// Site Config
export async function getSiteConfig(): Promise<SiteConfig | null> {
  try {
    const response = await fetch(`${API_BASE}/api/site-config`);
    if (!response.ok) throw new Error('Failed to fetch site config');
    const data = await response.json();
    return data.config || null;
  } catch (error) {
    console.error('Error fetching site config:', error);
    return null;
  }
}

// Feed (unified content)
export type FeedItemType = 'post' | 'snippet' | 'gallery';

export interface FeedItem {
  type: FeedItemType;
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
}

export interface FeedResponse {
  items: FeedItem[];
  totalDocs: number;
  totalPages: number;
  page: number;
  hasNextPage: boolean;
}

export async function getFeed(
  page = 1,
  limit = 12,
  type: FeedItemType | 'all' = 'all'
): Promise<FeedResponse> {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      type,
    });
    const response = await fetch(`${API_BASE}/api/feed?${params}`);
    if (!response.ok) throw new Error('Failed to fetch feed');
    const data = await response.json();
    return {
      items: data.items || [],
      totalDocs: data.totalDocs || 0,
      totalPages: data.totalPages || 0,
      page: data.page || 1,
      hasNextPage: data.hasNextPage || false,
    };
  } catch (error) {
    console.error('Error fetching feed:', error);
    return { items: [], totalDocs: 0, totalPages: 0, page: 1, hasNextPage: false };
  }
}

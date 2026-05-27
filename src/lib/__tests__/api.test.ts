// src/lib/__tests__/api.test.ts
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import {
  getPosts,
  getPostBySlug,
  getAlbums,
  getSnippets,
  getSiteConfig,
} from '../api';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('API Functions', () => {
  beforeAll(() => {
    // Setup
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  describe('getPosts', () => {
    it('should fetch posts successfully', async () => {
      const mockPosts = [
        {
          id: '1',
          title: 'Test Post',
          slug: 'test-post',
          excerpt: 'Test excerpt',
          publishedAt: '2024-01-01',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ posts: mockPosts }),
      });

      const posts = await getPosts();
      expect(posts).toEqual(mockPosts);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/posts'),
        expect.any(Object)
      );
    });

    it('should return empty array on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const posts = await getPosts();
      expect(posts).toEqual([]);
    });
  });

  describe('getPostBySlug', () => {
    it('should fetch post by slug', async () => {
      const mockPost = {
        id: '1',
        title: 'Test Post',
        slug: 'test-post',
        excerpt: 'Test excerpt',
        content: '<p>Test content</p>',
        publishedAt: '2024-01-01',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ post: mockPost }),
      });

      const post = await getPostBySlug('test-post');
      expect(post).toEqual(mockPost);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/posts/test-post')
      );
    });

    it('should return null when post not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const post = await getPostBySlug('non-existent');
      expect(post).toBeNull();
    });
  });

  describe('getAlbums', () => {
    it('should fetch albums successfully', async () => {
      const mockAlbums = [
        {
          id: '1',
          title: 'Summer Photos',
          slug: 'summer-photos',
          imageCount: 10,
          publishedAt: '2024-01-01',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ albums: mockAlbums }),
      });

      const albums = await getAlbums();
      expect(albums).toEqual(mockAlbums);
    });
  });

  describe('getSnippets', () => {
    it('should fetch snippets successfully', async () => {
      const mockSnippets = [
        {
          id: '1',
          title: 'useWindowSize Hook',
          slug: 'use-window-size',
          description: 'React hook for window dimensions',
          language: 'javascript',
          publishedAt: '2024-01-01',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ snippets: mockSnippets }),
      });

      const snippets = await getSnippets();
      expect(snippets).toEqual(mockSnippets);
    });
  });

  describe('getSiteConfig', () => {
    it('should fetch site config', async () => {
      const mockConfig = {
        siteName: 'Wyss',
        tagline: 'Developer & Designer',
        social_links: [
          { platform: 'github', url: 'https://github.com/wyss' },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ config: mockConfig }),
      });

      const config = await getSiteConfig();
      expect(config).toEqual(mockConfig);
    });
  });
});

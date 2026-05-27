import { defineConfig } from 'astro/config';
import sitemap from 'astro-sitemap';
import robotsTxt from 'astro-robots-txt';

export default defineConfig({
  site: 'https://wyss.rocks',
  
  // Enable View Transitions API for page transitions
  integrations: [
    sitemap({
      changefreq: 'weekly',
      priority: 0.8,
      lastmod: new Date(),
    }),
    robotsTxt({
      sitemapBaseFileName: 'sitemap-index',
      policy: [
        {
          userAgent: '*',
          allow: '/',
          disallow: ['/admin', '/api'],
        },
      ],
    }),
  ],

  // Build output
  output: 'static',
  
  vite: {
    ssr: {
      external: ['payload'],
    },
  },

  // Markdown processing
  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },
});

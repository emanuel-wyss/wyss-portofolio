// server/render.ts — Server-side page rendering for detail views

import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function lexicalToHtml(content: any): string {
  if (!content) return '';
  if (typeof content === 'string') return content;

  try {
    return convertLexicalToHTML({
      data: content.root ? content : { root: content },
      disableContainer: true,
    });
  } catch {
    // If conversion fails, avoid throwing and render a safe fallback.
    return `<p>${escapeHtml(JSON.stringify(content))}</p>`;
  }
}

// ---------------------------------------------------------------------------
// Page template — reads the built Astro index.html and swaps <main> content
// ---------------------------------------------------------------------------

let cachedTemplate: string | null = null;

async function getTemplate(): Promise<string | null> {
  if (cachedTemplate) return cachedTemplate;
  try {
    const file = Bun.file('./dist/public/index.html');
    if (await file.exists()) {
      cachedTemplate = await file.text();
      return cachedTemplate;
    }
  } catch {
    // fall through
  }
  return null;
}

/**
 * Render a full HTML page by injecting content into the built Astro template.
 * Falls back to a self-contained page if the build output isn't available.
 */
export async function renderPage(
  title: string,
  description: string,
  mainHtml: string,
): Promise<string> {
  const tpl = await getTemplate();

  if (tpl) {
    let html = tpl;
    // Replace <title>
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)} | Wyss.rocks</title>`);
    // Replace og:title
    html = html.replace(
      /(<meta\s+property="og:title"\s+content=")[^"]*(")/,
      `$1${escapeHtml(title)}$2`,
    );
    // Replace description meta
    html = html.replace(
      /(<meta\s+name="description"\s+content=")[^"]*(")/,
      `$1${escapeHtml(description)}$2`,
    );
    html = html.replace(
      /(<meta\s+property="og:description"\s+content=")[^"]*(")/,
      `$1${escapeHtml(description)}$2`,
    );
    // Replace <main>…</main>
    html = html.replace(/<main>[\s\S]*?<\/main>/, `<main>${mainHtml}</main>`);
    return html;
  }

  // Fallback: self-contained HTML (dev mode / no build available)
  return fallbackPage(title, description, mainHtml);
}

function fallbackPage(title: string, description: string, mainHtml: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} | Wyss.rocks</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-primary: #ffffff; --bg-secondary: #f5f5f5;
      --text-primary: #000000; --text-secondary: #666666;
      --border-color: rgba(0,0,0,0.1); --accent: #0066ff; --accent-light: #e6f0ff;
      --font-display: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-body: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'Geist Mono', monospace;
      --spacing-xs: 0.25rem; --spacing-sm: 0.5rem; --spacing-md: 1rem;
      --spacing-lg: 2rem; --spacing-xl: 4rem; --spacing-2xl: 8rem;
      --z-sticky: 200;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg-primary: #0a0a0a; --bg-secondary: #1a1a1a;
        --text-primary: #ffffff; --text-secondary: #999999;
        --border-color: rgba(255,255,255,0.1); --accent: #00a8ff; --accent-light: #003d66;
      }
    }
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { font-family: var(--font-body); background: var(--bg-primary); color: var(--text-primary); line-height: 1.6; }
    main { min-height: 100vh; }
    h1,h2,h3,h4,h5,h6 { font-family: var(--font-display); font-weight: 600; line-height: 1.2; margin-bottom: var(--spacing-md); }
    h1 { font-size: 3rem; } h2 { font-size: 2rem; } h3 { font-size: 1.5rem; }
    p { margin-bottom: var(--spacing-md); color: var(--text-secondary); }
    a { color: var(--accent); text-decoration: none; } a:hover { color: var(--text-primary); }
    code { font-family: var(--font-mono); font-size: 0.875em; background: var(--accent-light); padding: 0.2em 0.4em; border-radius: 3px; }
    pre { background: var(--bg-secondary); padding: var(--spacing-lg); border-radius: 8px; overflow-x: auto; margin-bottom: var(--spacing-lg); }
    pre code { padding: 0; background: transparent; }
    blockquote { border-left: 3px solid var(--accent); padding-left: var(--spacing-md); margin: var(--spacing-lg) 0; color: var(--text-secondary); }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 var(--spacing-lg); }
    .nav { position: sticky; top: 0; z-index: var(--z-sticky); border-bottom: 1px solid var(--border-color); background: var(--bg-primary); backdrop-filter: blur(10px); }
    .nav-inner { max-width: 1200px; margin: 0 auto; padding: 0 var(--spacing-lg); height: 56px; display: flex; align-items: center; justify-content: space-between; }
    .logo { font-family: var(--font-display); font-weight: 700; font-size: 1.125rem; letter-spacing: 0.12em; color: var(--text-primary); text-decoration: none; }
    .logo:hover { opacity: 0.65; color: var(--text-primary); }
    .nav nav { display: flex; gap: var(--spacing-lg); }
    .nav-link { font-size: 0.9rem; font-weight: 500; color: var(--text-secondary); text-decoration: none; }
    .nav-link:hover { color: var(--text-primary); }
    .footer { border-top: 1px solid var(--border-color); padding: 2rem; margin-top: 4rem; text-align: center; }
    .footer p { font-size: 0.875rem; color: var(--text-secondary); }
    @media (max-width: 768px) { h1 { font-size: 2rem; } .container { padding: 0 var(--spacing-md); } }
  </style>
</head>
<body>
  <header class="nav"><div class="nav-inner"><a href="/" class="logo">WYSS</a><nav><a href="/about" class="nav-link">About</a> <a href="/work" class="nav-link">Work</a></nav></div></header>
  <main>${mainHtml}</main>
  <footer class="footer"><p>&copy; ${new Date().getFullYear()} Wyss. All rights reserved.</p></footer>
</body>
</html>`;
}

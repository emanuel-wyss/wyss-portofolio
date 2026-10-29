// server/render.ts — Lexical rich-text → HTML for the API.
// Detail pages are now rendered by the SPA (TanStack Router); this module only
// converts Payload's Lexical content into HTML for the /api/posts/:slug response.

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

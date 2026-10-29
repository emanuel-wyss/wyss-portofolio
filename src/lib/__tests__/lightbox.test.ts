import { test, expect } from 'bun:test';

// The page-transition wrapper uses `transform`, which would turn any fixed
// descendant into page-relative positioning. The lightbox must be portaled.
test('lightbox is portaled to document.body', async () => {
  const src = await Bun.file('src/routes/gallery.$slug.tsx').text();
  expect(src).toContain('createPortal(');
  expect(src).toContain('document.body');
});

test('lightbox image is clamped to the viewport', async () => {
  const css = await Bun.file('src/styles/components.css').text();
  expect(css).toMatch(/\.nerdy-lightbox-img \{[^}]*max-height: calc\(100dvh/);
  expect(css).toMatch(/\.nerdy-lightbox \{[^}]*position: fixed/);
});

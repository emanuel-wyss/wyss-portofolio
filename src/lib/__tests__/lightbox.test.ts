import { test, expect } from "bun:test";

test("lightbox CSS positioning uses fixed viewport positioning", async () => {
  const css = await Bun.file("src/styles/components.css").text();
  expect(css).toContain(".nerdy-lightbox {");
  expect(css).toContain("position: fixed");
  expect(css).toContain("width: 100vw");
  expect(css).toContain("height: 100vh");
  expect(css).toContain("z-index: 999999");
});

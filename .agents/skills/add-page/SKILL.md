# Skill: add-page

## Description
Add a new Astro page (static or dynamic) with proper layout, SEO, and data fetching.

## Triggers
- When the user wants a new route on the site (e.g. `/about`, `/posts/[slug]`, `/gallery`)

## Repository Context

**Pages directory:** `src/pages/` — Astro file-based routing.  
**Layout:** `src/layouts/Layout.astro` — wraps every page; requires `title`, `description` props; includes `ClientRouter` for view transitions.  
**SEO component:** `src/components/SEO.astro` — handles meta, OG, structured data.  
**API fetching:** `src/lib/api.ts` — use existing functions (`getPosts`, `getAlbums`, etc.) or add new ones via the `/add-collection` skill.  
**Theme:** CSS variables are set globally; use `var(--bg-primary)`, `var(--text-primary)`, etc.

**Static page pattern:**
```astro
---
import Layout from '@layouts/Layout.astro';
const data = await getSomeData();
---
<Layout title="..." description="...">
  <!-- content -->
</Layout>
```

**Dynamic route pattern** (`src/pages/posts/[slug].astro`):
```astro
---
export async function getStaticPaths() {
  const posts = await getPosts();
  return posts.map(p => ({ params: { slug: p.slug }, props: { post: p } }));
}
const { post } = Astro.props;
---
```

## Steps

1. Clarify with the user: route path, static or dynamic, what data it needs.
2. Create the `.astro` file in `src/pages/`.
3. Wrap content in `<Layout>` with meaningful `title` and `description`.
4. Fetch data in the frontmatter using functions from `src/lib/api.ts`.
5. For dynamic routes, implement `getStaticPaths()`.
6. Run `bun run build` to verify the page compiles and generates correctly.
7. Run `/type-check` to confirm no TS errors.

## Success Criteria
`bun run build` succeeds and the new route appears in the build output.

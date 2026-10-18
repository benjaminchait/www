# Exploring a migration to Astro

Status: **exploration / proposal** — nothing has been migrated yet.
Written 18 October 2026, against the Eleventy 3.1 build on `main`.

## TL;DR

A migration is doable in a few focused sessions. The site is small: 110 posts, about 15 pages, 7 templates, 8 filters, 1 transform. Because the output is fully static, the Cloudflare Worker setup (`src/worker.js`, ASSETS binding, `_redirects`, R2 video) can stay as it is. **No Cloudflare adapter is needed.**

The hard parts are not Astro itself. They are the habits the site has built up on top of Eleventy:

1. **Kramdown-style `{:style="..."}` attributes** (16 uses in 5 files) come from `markdown-it-attrs`. Astro's Markdown pipeline is remark/rehype, which doesn't support this.
2. **Nunjucks inside Markdown**: `{% include "favorites-nav.njk" %}` in 6 favorites pages, and `{{ "" | dateNow }}` in the colophon.
3. **The outbound `?ref=` transform** rewrites every `<a href>` in the final HTML. Astro has no direct counterpart to Eleventy transforms.
4. **URL shape parity**: Eleventy writes `/archives/slug.html`, and Cloudflare serves it at `/archives/slug`. Canonicals, the feed, the sitemap, and 66 redirect rules all depend on that.

**Recommendation:** only do this if there is a concrete reason, such as wanting components, typed content collections, or built-in image processing (`astro:assets`, which covers the "image pipeline" TODO in `CLAUDE.md`). The site moved off Jekyll onto Eleventy in 2026, and the "keep it simple / replaceable technology" principle argues against another rewrite just for the sake of it. If we go ahead, do it as a branch with a **byte-level diff of `_site/` before and after** as the acceptance gate.

## Current inventory (what has to be ported)

| Eleventy piece | Where | Astro equivalent |
|---|---|---|
| `default.njk` + `head.njk` | `_includes/` | `src/layouts/Base.astro` (+ `Head.astro` component) |
| `home.njk`, `page.njk`, `post.njk` | `_includes/` | `Home.astro`, `Page.astro`, `Post.astro` layouts |
| `footer.njk`, `favorites-nav.njk` | `_includes/` | `Footer.astro`, `FavoritesNav.astro` |
| `posts` collection (published, sorted asc) | `eleventy.config.js` | `posts` content collection (glob loader on `_posts/`), filter `published !== false`, sort by `date` |
| `sitemap` collection | `eleventy.config.js` | assembled inside `src/pages/sitemap.xml.ts` |
| `_posts/_posts.json` (layout, tags, `og_type`) | `_posts/` | implicit: the post route always uses `Post.astro` with `og_type="article"` |
| `published: false` → no output | `eleventyComputed` | filter in `getStaticPaths()` / `getCollection()` |
| permalink → `.html` file | `eleventyComputed` | `build.format: 'file'` in `astro.config.mjs` |
| Filters `dateFormat`, `dateRfc822`, `dateDotFormat`, `dateNow` | config | `src/lib/dates.ts` (keep `luxon`, `America/Los_Angeles`) |
| Filters `stripHtml`, `normalizeWhitespace`, `xmlEscape`, `stripTrailingSlash` | config | small helpers in `src/lib/`; `xmlEscape` mostly goes away (Astro escapes by default; RSS lib escapes) |
| `outboundRefParam` transform | config | rehype plugin (Markdown) + `astro:build:done` pass, or HTML post-process (see below) |
| `markdown-it` + `markdown-it-attrs` | config | remark/rehype default; convert the 16 attribute uses (see below) |
| `feed.njk` (RSS 2.0 + `content:encoded`) | root | `src/pages/feed.xml.ts`, hand-written or `@astrojs/rss` |
| `feed-xsl.njk` | root | static `public/feed.xsl` (it has no template logic) |
| `sitemap.njk` | root | `src/pages/sitemap.xml.ts` (hand-written: `@astrojs/sitemap` emits `sitemap-index.xml`, a different URL) |
| `archives.njk`, `index.md`, `about.md`, `about/**`, `404.md` | root | `src/pages/` or a `pages` content collection |
| Passthrough: `assets/`, `.well-known/`, `_redirects`, `robots.txt`, `keybase.txt`, `waybackverify.txt`, iMessage key | config | move into `public/` |
| `src/worker.js` | `src/` | move to `worker/index.js` so it stays out of Astro's `src/`; update `wrangler.jsonc` `main` |

## Proposed target layout

```
astro.config.mjs
wrangler.jsonc            # main: worker/index.js, assets.directory: _site (unchanged)
worker/index.js           # moved from src/worker.js, otherwise unchanged
public/                   # everything that is copied verbatim today
  assets/ .well-known/ _redirects robots.txt keybase.txt waybackverify.txt feed.xsl
  about/imessage-contact-key-verification.txt
src/
  content.config.ts       # posts + pages collections, zod schemas
  content/posts/          # moved from _posts/ (filenames unchanged)
  content/pages/          # about.md, about/*.md, favorites, 2024-pdx-visit
  data/site.json          # moved from _data/
  layouts/  Base.astro Home.astro Page.astro Post.astro
  components/ Head.astro Footer.astro FavoritesNav.astro
  lib/ dates.ts urls.ts rehype-outbound-ref.mjs
  pages/
    index.astro           # renders index.md content via Home layout
    archives.astro
    archives/[slug].astro # posts, slug from frontmatter permalink
    [...slug].astro       # pages collection, path from frontmatter permalink
    404.astro
    feed.xml.ts
    sitemap.xml.ts
```

Notes:

- Keep `outDir: '_site'` so `wrangler.jsonc` and Cloudflare Workers CI only need the build command changed (`npx @11ty/eleventy` → `npm run build` / `astro build`).
- Keep `permalink` in front matter as the source of truth for URLs. Derive route params from it instead of from filenames, so the `/archives/slug` structure can't drift, which `CLAUDE.md` says to protect.
- Use `trailingSlash: 'never'` together with `build.format: 'file'`. That reproduces `archives/slug.html`, `about.html`, `about/favorites/boulder.html`, `404.html`.

## Tricky bits and how to handle them

### 1. `{:style="..."}` attributes (16 uses / 5 files)

Options, in order of preference:

- **A. Convert to inline HTML** (`<img src alt style>` and a wrapping `<p style>`). It's a one-time mechanical edit to 5 files, there's no dependency, and it is the most portable choice: it works in any future generator. Recommended.
- B. Use a remark attributes plugin. The available ones use `{...}` rather than kramdown's `{:...}`, have uneven maintenance, and would still require editing the files.
- C. Swap Astro's Markdown renderer for markdown-it through a custom integration. That keeps today's syntax but fights the framework, and it loses content-collection rendering.

The image-row-then-paragraph-attribute pattern in `about.md` needs care, because the trailing `{:style}` line styles the *paragraph* that holds the three images.

### 2. Nunjucks in Markdown

- Favorites nav (6 files): drop the `{% include %}` line and render `<FavoritesNav />` from the page layout when the front matter has `favorites: true`. Alternatively, make those 6 files `.mdx` and import the component. That would add `@astrojs/mdx`, though, so prefer the front matter flag.
- Colophon "last published at": add a `buildTime` front matter value or a layout slot. Simplest is a `Colophon` layout variant, or computing the value in `[...slug].astro` and passing it in. Either way the Markdown no longer carries template code.

### 3. Outbound `?ref=` links

Eleventy applies this to **every** `.html` output, including links in layouts. Note that it does **not** apply to `feed.xml` today.

- Markdown content: write a small rehype plugin (about 30 lines, the same logic as the current transform) and register it in `markdown.rehypePlugins`.
- Layout and component links: these are all internal today, apart from the `rel="me"` links. Those are `<link>`, not `<a>`, so they're unaffected. A rehype plugin is therefore enough for parity.
- Fallback for exact parity: an `astro:build:done` integration hook that runs the existing regex over `_site/**/*.html`. It's a direct port and catches everything.
- Decide whether `content:encoded` in the feed should get `?ref=`. If the feed renders `post.rendered.html`, the rehype plugin applies there too, which is a small behavior change from today.

### 4. Inline scripts

Astro processes and bundles `<script>` tags by default. The Plausible snippet in `head.njk` and the `plausible("404", …)` call in `404.md` must be written as `<script is:inline>`. Otherwise they get hoisted into a module bundle, which would break the "no JS beyond Plausible" rule in spirit and could break the `/pio/` proxy path. Also confirm that Astro adds no client JS anywhere (no islands, no view transitions).

### 5. Feed and sitemap parity

- `feed.xml`: keep RSS 2.0, the `<?xml-stylesheet href="/feed.xsl"?>` line, the latest 10 posts, `dateRfc822` in Pacific time, and full `content:encoded`. `@astrojs/rss` supports a `stylesheet` option and custom namespaces, but a hand-written endpoint is about 30 lines with no extra dependency, and it matches the current output exactly. Prefer that.
- `sitemap.xml`: Eleventy currently uses each page's `date` for `<lastmod>`, which for non-posts is the file's creation time (in effect, the CI clone time) and is formatted as RFC 822 rather than W3C/ISO. That's a latent bug. Either reproduce it or fix it during the migration (ISO dates, post date for posts, omit lastmod for pages). Call it out in the PR either way.

### 6. Unpublished content

`_posts` has 3 posts with `published: false`, and `2024-pdx-visit/index.md` is unpublished. Filter both in collections **and** in `getStaticPaths()`, so no HTML is emitted. Then verify that `find _site -name '*pdx*'` comes back empty.

### 7. Images

This is out of scope for the first pass: keep `/assets/img/**` in `public/` so every URL stays the same. A later, separate project could move post images next to their posts and use `astro:assets` (`<Image>` / Markdown `![]()` with relative paths) for build-time resizing. That's the main real *payoff* of Astro for this site, and it addresses the "Improve image pipeline" and "Normalize image sizes" TODOs.

## Dependency and runtime changes

- Add `astro` (currently 7.4.x, Node `>=22.22.0`). `.node-version` says `24`, which is fine. Local Node 22.22 also just meets the bar.
- Keep `luxon`.
- Remove `@11ty/eleventy`, `markdown-it`, `markdown-it-attrs`.
- Avoid `@astrojs/mdx`, `@astrojs/sitemap`, `@astrojs/rss`, and `@astrojs/cloudflare` unless a concrete need shows up. That keeps the net dependency count about the same, in line with "do not add npm packages without strong justification".
- Update `package.json` scripts (`build`, `serve` → `astro dev`, `preview`), the Cloudflare Workers CI build command, `CLAUDE.md`, and `README.md` (history: "2026: Eleventy → Astro").

## Phased plan

**Phase 0: Spike (about 1 session, throwaway branch)**
- `npm create astro` into a scratch dir, then port `Base`/`Post` layouts and a posts collection for 3 posts.
- Confirm that `build.format: 'file'` + `trailingSlash: 'never'` + `outDir: '_site'` yields `archives/<slug>.html`, and that `wrangler dev` serves `/archives/<slug>` with the worker unchanged.
- Confirm that `is:inline` scripts come out byte-identical.
- Go/no-go decision.

**Phase 1: Baseline**
- Build the current site and snapshot `_site/` (HTML, `feed.xml`, `sitemap.xml`, file list) to compare against.
- Write a small diff script (scratch only, not committed) that normalizes whitespace and compares file lists plus HTML bodies.

**Phase 2: Scaffold and static files**
- Add `astro.config.mjs` and `src/content.config.ts`. Move `src/worker.js` → `worker/index.js` and update `wrangler.jsonc`.
- `git mv` passthrough files into `public/`, and turn `feed-xsl.njk` into `public/feed.xsl`.

**Phase 3: Layouts, components, helpers**
- Port `head`/`default`/`home`/`page`/`post`/`footer`/`favorites-nav` to `.astro`, and port the filters to `src/lib/`.
- Prev/next nav in `Post.astro`: index into the sorted posts array (simpler than today's loop).

**Phase 4: Content**
- `git mv _posts/*.md src/content/posts/`, and drop `_posts.json`.
- Convert the 16 `{:style}` uses to inline HTML.
- Remove Nunjucks from the favorites pages and the colophon.
- Move pages into `src/content/pages/` (or `src/pages/*.md` where no filtering is needed).

**Phase 5: Endpoints and transforms**
- `feed.xml.ts`, `sitemap.xml.ts`, `404.astro`, `archives.astro`.
- Outbound-ref rehype plugin (plus a build-done hook if needed for parity).

**Phase 6: Verify**
- Diff `_site/` against the baseline. The expected differences are an Astro `generator` meta (omit it), attribute order and whitespace, and any sitemap fix you chose deliberately.
- Check the file list for parity: 123 output files plus the copied assets today.
- `wrangler dev`: spot-check `/`, `/about`, `/archives`, a post, a favorites page, `/feed.xml` (rendered via XSL in a browser), `/sitemap.xml`, `/404`, a `_redirects` rule, `/pio/js/...`, `/assets/newsletter/...`, `/assets/video/...`.
- Validate the feed (W3C feed validator) and the `rel="me"` links.

**Phase 7: Ship**
- Update the Cloudflare Workers CI build command and docs.
- Merge, deploy, and watch Plausible for 404 spikes for a week.

## Risks

| Risk | Mitigation |
|---|---|
| URL changes break inbound links and redirects | `build.format: 'file'`, permalink-derived routes, file-list diff against baseline |
| Feed GUID changes cause readers to re-show old posts | GUID = `site.url + stripTrailingSlash(url)`, unchanged; diff `feed.xml` |
| Astro injects JS/CSS (scoped styles, hoisted scripts) | No `<style>` in components (keep `/assets/style.css`), `is:inline` scripts, grep `_site` for `/_astro/` |
| Framework churn (Astro majors ship roughly yearly) | Keep logic in plain TS helpers and content in plain Markdown/HTML, so a future swap stays cheap |
| Build-time cost or complexity grows vs. Eleventy | The current build takes about 20 s (mostly copying 933 assets). Compare in the spike. |

## Open questions for Benjamin

1. What's the motivation: components, `astro:assets` image processing, typed front matter, or something else? The answer decides whether the image-pipeline work belongs in the first pass.
2. OK to convert `{:style}` attributes to inline HTML in post Markdown?
3. Should the sitemap `lastmod` bug be fixed during the migration, or kept for strict parity?
4. Should feed `content:encoded` links carry `?ref=` (new behavior) or not (current)?

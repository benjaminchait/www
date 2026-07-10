# Eleventy → Astro migration notes

This branch is a working exploration of migrating benjaminchait.net from
Eleventy 3.x to Astro 5.x. The site builds, serves through the existing
Cloudflare Worker, and the output was verified page-by-page against the
Eleventy build (see "Verification" below).

## What stayed the same

- **All content, in place.** `_posts/` (YYYY-MM-DD-slug.md), `about/`,
  `index.md`, `404.md`, and `2024-pdx-visit/` were not moved. Astro's glob
  content loaders read them from their existing locations, so the authoring
  workflow (front matter, permalinks, image conventions) is unchanged.
- **All URLs.** Permalinks still come from front matter; output is still flat
  `.html` files (`archives/slug.html`) served extensionless by the Cloudflare
  ASSETS binding. The built file list is identical to Eleventy's.
- **Cloudflare setup.** `src/worker.js`, `_redirects` (now at
  `public/_redirects`), and `wrangler.jsonc` are unchanged apart from the
  output directory (`_site` → `dist`).
- **Site data** still lives in `_data/site.json`.
- **No client-side JavaScript** beyond the existing Plausible snippet.

## What changed

| Eleventy | Astro |
|---|---|
| `eleventy.config.js` | `astro.config.mjs` + `src/content.config.mjs` |
| `_includes/*.njk` (Nunjucks) | `src/layouts/Base.astro`, `src/components/*.astro` |
| `archives.njk`, `feed.njk`, `sitemap.njk`, `index.md` routing | `src/pages/` (`index.astro`, `archives.astro`, `404.astro`, `[...slug].astro`, `feed.xml.js`, `sitemap.xml.js`) |
| `markdown-it` + `markdown-it-attrs` | Astro's built-in remark pipeline + a ~90-line custom plugin (`src/lib/remark-kramdown-attrs.mjs`) for the `{:style="..."}` syntax |
| Eleventy filters (`dateFormat`, `xmlEscape`, …) | Plain JS helpers in `src/lib/` (still using luxon) |
| Passthrough copies (`assets/`, `robots.txt`, …) | Moved into `public/` (Astro's static dir) |
| `feed-xsl.njk` | `public/feed.xsl` (it had no template variables) |
| `{% include "favorites-nav.njk" %}` in markdown | `favorites_nav: true` front matter + `FavoritesNav.astro` rendered by the page route |
| `{{ "" \| dateNow }}` in the colophon | `{{ build_time }}` token replaced at build time by `src/lib/remark-build-time.mjs` |
| `_posts/_posts.json` directory data | Post defaults live in the posts collection schema / post route |

Dependencies went from 4 (`@11ty/eleventy`, `markdown-it`, `markdown-it-attrs`,
`luxon`) to 2 (`astro`, `luxon`).

## Notable details and trade-offs

- **Nunjucks-in-markdown is gone.** Eleventy preprocessed markdown through
  Nunjucks; Astro does not. Only two things relied on it (favorites nav
  include, colophon timestamp) and both were replaced as above. Any future
  need for components inside content would mean adopting MDX.
- **Kramdown-style attributes** (`![img](/path){:style="..."}`) are handled by
  the custom remark plugin. It covers the three forms used in this repo's
  content (inline-after-element, end-of-paragraph, standalone-paragraph). New
  exotic uses of `markdown-it-attrs` syntax may need plugin updates.
- **Markdown config matched deliberately:** `smartypants: false`,
  `syntaxHighlight: false`, `gfm: false` to mirror markdown-it's defaults
  (no autolinking of bare URLs/emails — with GFM on, the raw-HTML email link
  on /about got double-linked). No content uses tables or strikethrough.
- **Headings now get `id` attributes** (Astro always adds them). Harmless —
  enables deep links — but it is a small output difference.
- **Content schemas are now validated** (zod): a missing `title` or malformed
  `date` in a post fails the build instead of silently rendering wrong.
- **Sitemap `<lastmod>` for non-post pages** now uses build time; Eleventy
  used file mtime, which on CI (fresh checkout) was effectively build time
  anyway. Posts still use their front-matter date.
- **The RSS feed** renders full post HTML via Astro's container API
  (`experimental_AstroContainer`) — the one experimental API this uses.

## Required deployment change (outside the repo)

Cloudflare Workers CI/CD build command must change from
`npm ci && npx @11ty/eleventy` to `npm ci && npm run build`
(output directory is configured in `wrangler.jsonc`, already updated).

## Verification

Both generators were built from the same content and compared:

- **File sets:** identical (1,000+ files including passthrough assets; 116
  HTML pages + feed.xml + sitemap.xml + feed.xsl).
- **Semantic HTML diff** (normalizing whitespace, attribute quoting/entity
  encoding, self-closing tags, and Astro's added heading ids): 117 of 120
  generated files byte-equivalent; the 3 differences are intentional
  (colophon wording/timestamp, trailing whitespace inside feed CDATA,
  sitemap entry ordering — URL sets identical).
- **Serving path:** ran `wrangler dev` against `dist/` and spot-checked
  pages, `_redirects` rules (302 `/feed` → `/feed.xml`), feed, sitemap,
  favorites nav, colophon timestamp, and inline image styles.

Build time is comparable (~3.5s for 118 pages, either way).

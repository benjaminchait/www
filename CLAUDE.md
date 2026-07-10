# CLAUDE.md

This file provides guidance for AI assistants working with this repository.

## Project Overview

This is **benjaminchait.net**, a personal homepage and blog built with [Astro](https://astro.build/) (Node.js-based static site generator). The site is deployed on [Cloudflare Workers](https://workers.cloudflare.com/) with DNS managed through Cloudflare.

**Repository:** https://github.com/benjaminchait/www
**Live site:** https://benjaminchait.net

## Build & Development Commands

```bash
# Install dependencies
npm ci

# Run local development server
npm run serve      # astro dev

# Build the site (outputs to dist/)
npm run build      # astro build

# Build and preview through the Cloudflare Worker
npm run preview    # astro build && wrangler dev
```

**Node version:** 22 (specified in `.node-version`)
**Astro version:** 5.x (pinned in `package.json`)

## Project Structure

```
astro.config.mjs         # Astro configuration (markdown pipeline, output format)
wrangler.jsonc           # Cloudflare Workers configuration
src/worker.js            # Cloudflare Worker: proxy/rewrite rules + static asset serving
src/content.config.mjs   # Content collections: posts (_posts/) and pages (about/, etc.)
src/layouts/Base.astro   # HTML shell + <head> (meta, OpenGraph, favicons, Plausible)
src/components/          # Footer.astro, FavoritesNav.astro
src/pages/               # Routes:
  index.astro            #   homepage (renders index.md + recent posts)
  archives.astro         #   /archives post listing
  404.astro              #   404 page (renders 404.md)
  [...slug].astro        #   posts + pages routed by front-matter `permalink`
  feed.xml.js            #   RSS feed endpoint
  sitemap.xml.js         #   sitemap endpoint
src/lib/                 # dates.mjs (luxon helpers), xml.mjs (escaping),
                         # remark-kramdown-attrs.mjs ({:style="..."} syntax),
                         # remark-build-time.mjs ({{ build_time }} token)
_data/site.json          # Site-level variables (title, URL, description)
_posts/                  # Blog posts (YYYY-MM-DD-slug.md format)
about/                   # About section pages and favorites/
index.md, 404.md         # Homepage and 404 content (rendered by src/pages routes)
public/                  # Static files copied verbatim to dist/
  _redirects             #   redirect rules (honored by ASSETS binding; 301/302 only)
  assets/style.css       #   main stylesheet (single file, ~90 lines)
  assets/img/            #   all images (posts/, about/, favicon_io/)
  feed.xsl               #   RSS feed stylesheet
  .well-known/           #   domain verification files
  robots.txt             #   blocks AI crawlers, allows standard crawlers
```

### Layouts and routing

- `src/layouts/Base.astro` is the single HTML shell (equivalent to the old `default.njk` + `head.njk`).
- `src/pages/[...slug].astro` renders every post and standalone page at the URL in its front-matter `permalink`, choosing the presentation by collection and by the page's `layout` front matter (`page.njk` → framed page with title/footer; `default.njk` → bare content).
- Output uses `build.format: "file"` so `/archives/slug` is written as `archives/slug.html`, matching the extensionless URLs served by the Cloudflare ASSETS binding.

## Content Conventions

### Blog Posts

Posts live in `_posts/` with the naming pattern `YYYY-MM-DD-slug.md` and are loaded by the `posts` content collection (schema in `src/content.config.mjs`).

**Required front matter:**
```yaml
---
title: "Post Title"
description: "Short description for SEO/social"
published: true
date: YYYY-MM-DDTHH:MM:SS-07:00
permalink: /archives/slug
---
```

**Optional front matter:**
- `ogimage: /assets/img/path/to/image.jpeg` - OpenGraph image for social sharing
- `location: City, State, Country` - informational only

### Static Pages

Pages (in `about/` etc.) use front matter `layout: page.njk` (or `default.njk` for bare pages) and a `permalink`. The favorites pages set `favorites_nav: true` to render the shared favorites navigation. Setting `published: false` on any post or page excludes it from the build.

### Images

- Blog post images go in `public/assets/img/posts/YYYY-MM-DD-slug/`
- Images are sized at **1280px width** (640px layout at 2x for retina)
- Use lowercase filenames with `.jpeg` extension
- Reference images in markdown with inline styles: `![alt text](/path){:style="..."}` (handled by `src/lib/remark-kramdown-attrs.mjs`)

## Styling

The site uses a single, minimal CSS file (`public/assets/style.css`):
- System font stack (`-apple-system, BlinkMacSystemFont, ...`)
- Max width: `40rem` with `2rem` padding
- Dark mode support via `@media (prefers-color-scheme: dark)`
- Link color: `#0074D9`
- Minimal class system: `.muted`, `.small`, `.not-muted`

## Deployment

- **CI/Deploy:** Cloudflare Workers CI/CD (auto-builds and deploys on push)
- **Build:** `npm ci && npm run build` (output dir `dist`)
- **Hosting:** Cloudflare Workers (static assets via ASSETS binding; worker entry: `src/worker.js`)
- **Analytics:** Plausible Analytics (privacy-focused), proxied through `src/worker.js`
- **Redirects:** Simple redirects in `public/_redirects` (honored by ASSETS binding, 301/302 only); proxy/rewrite rules in `src/worker.js`
- **DNS:** Cloudflare (custom domain routed to the Worker)

## Key Design Principles

From the project README:

1. **Keep it simple** - bias toward replaceable, non-proprietary technology
2. **Focus on content** - text and images are paramount
3. **Speed is usability** - optimize for performance
4. **Build scalable workflows** - support future image handling
5. **Work in public** - transparent and shareable

## Dependencies

| Package | Purpose |
|---------|---------|
| `astro` 5.x | Static site generator (includes the remark markdown pipeline) |
| `luxon` | Date formatting with timezone support |

Markdown is configured in `astro.config.mjs` with `smartypants: false`, `syntaxHighlight: false`, and `gfm: false` to match the site's longstanding markdown-it behavior (no smart quotes, no autolinked bare URLs). The kramdown-style `{:style="..."}` attribute syntax is implemented by a small custom remark plugin.

## Important Files

- `astro.config.mjs` - Markdown pipeline, output format, site URL
- `src/content.config.mjs` - Content collection loaders and schemas
- `wrangler.jsonc` - Cloudflare Workers configuration (entry point, ASSETS binding)
- `src/worker.js` - Cloudflare Worker: proxy/rewrite rules, then falls through to ASSETS
- `_data/site.json` - Site title, URL, description, social usernames
- `public/_redirects` - 70+ redirect rules (legacy URLs, simple 301/302 redirects; honored by ASSETS binding)
- `public/robots.txt` - Blocks AI crawlers (GPTBot, ClaudeBot, etc.) while allowing standard crawlers
- `src/pages/feed.xml.js` - RSS feed endpoint
- `public/.well-known/security.txt` - Security contact information
- `MIGRATION.md` - Notes from the Eleventy → Astro migration

## Dates and Timestamps

Always use Pacific Time (`America/Los_Angeles`) for any dates or timestamps. Post dates use ISO 8601 format with timezone offset (e.g., `2024-01-15T12:00:00-07:00`).

## Active Projects / TODOs

### GitHub Actions

- [ ] Decide whether to add a GitHub Actions workflow (e.g. for linting/validation)

### Newsletter assets

Newsletter assets (images, etc.) are stored in [benjaminchait/newsletter](https://github.com/benjaminchait/newsletter) and served via a Cloudflare Worker at `newsletter.benjaminchait.workers.dev`. The `src/worker.js` proxies `/assets/newsletter/*` and `/assets/buttondown/*` (legacy) to this Worker.

- [ ] Use `/assets/newsletter/` paths for any new post content going forward (no existing posts reference `/assets/buttondown/`)
- [ ] If the newsletter provider changes, update the `/newsletter` redirect in `public/_redirects`

### Clean up extra pages

Some pages (e.g. `uses`) may be stale or no longer worth maintaining.

- [ ] Review all static pages under `about/` and root
- [ ] Decide which pages to keep, archive, or remove (e.g. `uses`)

### Revisit "favorites" / recommendations page

The current favorites page may not be the right format. Options to consider:

- [ ] Evaluate whether a structured data approach (e.g. JSON/YAML data file rendered via template) makes sense
- [ ] Consider whether written-style posts or longform content would be more appropriate
- [ ] Decide on format and update or replace the current page accordingly

### Revisit dark mode

- [ ] Review current dark mode implementation in `public/assets/style.css`
- [ ] Identify any colors, images, or elements that don't adapt well
- [ ] Make targeted improvements

### Revisit CSS styling

- [ ] Audit `public/assets/style.css` for any improvements or simplifications
- [ ] Ensure styling is consistent across all page types (home, page, post)

### Normalize image sizes

Images are inconsistently sized: some are 1200px wide, others are 600px wide (originally tall portrait images at 1200px height).

- [ ] Audit existing images in `public/assets/img/` for size inconsistencies
- [ ] Establish and document a consistent sizing convention (current target: 1280px width)
- [ ] Resize or re-export any non-conforming images

### Cloudflare migration notes

Migrated from Netlify to Cloudflare Workers in March 2026. Key details:
- Proxy/rewrite rules are handled by `src/worker.js` before falling through to static assets
- Simple redirects remain in `public/_redirects` (honored by the ASSETS binding, 301/302 only)
- DNS is managed in Cloudflare; custom domain routes to the Worker

- [ ] Check that `www.benjaminchait.net` redirects to the apex domain `benjaminchait.net`

### Astro migration notes

Migrated from Eleventy to Astro in July 2026 (see `MIGRATION.md` for details).

- [ ] Update the Cloudflare Workers CI/CD build command to `npm ci && npm run build`
- [ ] Consider replacing the experimental container API in `src/pages/feed.xml.js` once Astro ships a stable equivalent

### Improve image pipeline (build-time processing)

Currently images are manually resized before committing. Consider storing originals and processing at build time.

- [ ] Evaluate storing raw/original exports from Apple Photos (resized but otherwise unprocessed)
- [ ] Research build-time image resizing options compatible with Astro and Cloudflare Workers (e.g. `astro:assets`)
- [ ] Decide whether to adopt a build-time pipeline and document the approach

## Potential Future Projects


## Things to Avoid

- Do not add JavaScript beyond the existing Plausible analytics snippet
- Do not introduce CSS frameworks or preprocessors; the site uses a single minimal CSS file
- Do not change the permalink structure for existing posts (many redirects depend on `/archives/slug`)
- Do not commit large unoptimized images; resize to 1280px width first
- Do not add npm packages without strong justification; simplicity is a core principle

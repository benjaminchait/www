# CLAUDE.md

This file provides guidance for AI assistants working with this repository.

## Project Overview

This is **benjaminchait.net**, a personal homepage and blog built with [Eleventy](https://www.11ty.dev/) (Node.js-based static site generator). The site is deployed on [Cloudflare Pages](https://pages.cloudflare.com/) with DNS managed through Cloudflare.

**Repository:** https://github.com/benjaminchait/www
**Live site:** https://benjaminchait.net

## Build & Development Commands

```bash
# Install dependencies
npm ci

# Run local development server
npx @11ty/eleventy --serve

# Build the site (outputs to _site/)
npx @11ty/eleventy
```

**Node version:** 22 (specified in `.node-version`)
**Eleventy version:** 3.x (pinned in `package.json`)

## Project Structure

```
eleventy.config.js   # Eleventy configuration (filters, collections, passthrough)
_data/site.json      # Site-level variables (title, URL, description)
_includes/           # Nunjucks templates and partials
_posts/              # Blog posts (YYYY-MM-DD-slug.md format)
_posts/_posts.json   # Directory data file (default layout + tags for posts)
_redirects           # Redirect rules (Cloudflare Pages format; simple 301/302 only)
functions/
  _middleware.js     # Cloudflare Pages Function for proxy/rewrite rules
about/               # About section pages and favorites/
assets/
  style.css          # Main stylesheet (single file, ~90 lines)
  img/               # All images (organized by section)
    posts/           # Blog post images (matched by date)
    about/           # About section images
    favicon_io/      # Favicon assets
.github/workflows/   # GitHub Actions CI
.well-known/         # Domain verification files
```

### Template Hierarchy

All templates are Nunjucks (`.njk`) files in `_includes/`:

```
default.njk          # Base HTML shell, includes head.njk
  ├── home.njk       # Homepage, includes footer.njk
  ├── page.njk       # Static pages, includes footer.njk
  └── post.njk       # Blog posts with prev/next nav, includes footer.njk
```

## Content Conventions

### Blog Posts

Posts live in `_posts/` with the naming pattern `YYYY-MM-DD-slug.md`.

The directory data file (`_posts/_posts.json`) automatically sets `layout: post.njk` and `tags: posts` for all posts.

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

### Static Pages

Pages use `layout: page.njk` and include a `permalink` in front matter.

### Images

- Blog post images go in `assets/img/posts/YYYY-MM-DD-slug/`
- Images are sized at **1280px width** (640px layout at 2x for retina)
- Use lowercase filenames with `.jpeg` extension
- Reference images in markdown with inline styles: `![alt text](/path){:style="..."}`

## Styling

The site uses a single, minimal CSS file (`assets/style.css`):
- System font stack (`-apple-system, BlinkMacSystemFont, ...`)
- Max width: `40rem` with `2rem` padding
- Dark mode support via `@media (prefers-color-scheme: dark)`
- Link color: `#0074D9`
- Minimal class system: `.muted`, `.small`, `.not-muted`

## Deployment

- **CI:** GitHub Actions (no build steps; builds happen externally)
- **Build:** Cloudflare Pages auto-builds on push (`npm ci && npx @11ty/eleventy`, output dir `_site`)
- **Hosting:** Cloudflare Pages auto-deploys from the repository
- **Analytics:** Plausible Analytics (privacy-focused), proxied through `functions/_middleware.js`
- **Redirects:** Simple redirects in `_redirects` (Cloudflare Pages format); proxy/rewrite rules in `functions/_middleware.js`
- **DNS:** Cloudflare (custom domain added to CF Pages project; CNAME auto-created)

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
| `@11ty/eleventy` 3.x | Static site generator |
| `markdown-it` | Markdown processing |
| `markdown-it-attrs` | Kramdown-style `{:style="..."}` attribute syntax |
| `luxon` | Date formatting with timezone support |

## Important Files

- `eleventy.config.js` - Filters, collections, passthrough copies, markdown config
- `_data/site.json` - Site title, URL, description, social usernames
- `_posts/_posts.json` - Default layout and tags for all blog posts
- `_redirects` - 70+ redirect rules (legacy URLs, simple 301/302 redirects)
- `functions/_middleware.js` - Cloudflare Pages Function for proxy/rewrite rules (newsletter assets, Plausible analytics)
- `robots.txt` - Blocks AI crawlers (GPTBot, ClaudeBot, etc.) while allowing standard crawlers
- `feed.njk` - RSS feed template
- `.well-known/security.txt` - Security contact information

## Dates and Timestamps

Always use Pacific Time (`America/Los_Angeles`) for any dates or timestamps. Post dates use ISO 8601 format with timezone offset (e.g., `2024-01-15T12:00:00-07:00`).

## Active Projects / TODOs

### Remove builds from GitHub Actions

Builds should happen externally (Netlify), not in GitHub Actions. The `.github/workflows/eleventy.yml` workflow previously ran `npm ci` + `npx @11ty/eleventy` and archived the `_site/` artifact.

- [x] Remove build and archive steps from `.github/workflows/eleventy.yml`
- [x] Update Deployment section in `CLAUDE.md` to reflect that builds happen on Netlify
- [ ] Decide whether to keep a minimal GitHub Actions workflow (e.g. for linting/validation) or remove it entirely

### Rename `/assets/buttondown` proxy to `/assets/newsletter`

The `/assets/buttondown/*` proxy in `_redirects` is vendor-specific and should be renamed to the more generic `/assets/newsletter/*`. Newsletter assets (images, etc.) are stored in [benjaminchait/newsletter](https://github.com/benjaminchait/newsletter), deployed to `benjaminchait-newsletter.netlify.app`, and proxied through this site.

Steps:
- [x] Add `/assets/newsletter/*` proxy rule in `_redirects` (same destination: `https://benjaminchait-newsletter.netlify.app/assets/:splat 200`)
- [x] Keep `/assets/buttondown/*` rule with a deprecation comment (retain indefinitely, or remove after ~12 months from the switchover date)
- [x] Update the comment block in `_redirects` to clarify the newsletter asset architecture
- [ ] Use `/assets/newsletter/` paths for any new post content going forward (no existing posts reference `/assets/buttondown/`)
- [ ] If the newsletter provider changes, update the `/newsletter` redirect on line 14 of `_redirects`

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

- [ ] Review current dark mode implementation in `assets/style.css`
- [ ] Identify any colors, images, or elements that don't adapt well
- [ ] Make targeted improvements

### Revisit CSS styling

- [ ] Audit `assets/style.css` for any improvements or simplifications
- [ ] Ensure styling is consistent across all page types (home, page, post)

### Normalize image sizes

Images are inconsistently sized: some are 1200px wide, others are 600px wide (originally tall portrait images at 1200px height).

- [ ] Audit existing images in `assets/img/` for size inconsistencies
- [ ] Establish and document a consistent sizing convention (current target: 1280px width)
- [ ] Resize or re-export any non-conforming images

### Migrate from Netlify to Cloudflare Pages

DNS is already in Cloudflare, making this migration smoother than typical. The biggest complexity is that Netlify's `_redirects` supports `200` status proxy/rewrite rules that silently forward to another origin — Cloudflare Pages' `_redirects` file does **not** support this. Any such rules need to be converted to a Pages Function (`functions/_middleware.js`) or a standalone Worker.

**Key notes:**
- **Proxy rules require Workers:** Any `200`-status rewrite rules in `_redirects` (e.g. the Plausible analytics proxy, newsletter assets proxy) cannot be ported as-is and need a Pages Function or Worker instead. Workers provide more control than Netlify rewrites.
- **DNS cutover is instant:** Since DNS is already managed in Cloudflare, adding a custom domain in CF Pages creates the CNAME record automatically — no TTL waiting needed.
- **Audit `_redirects` first:** Identify which rules are simple redirects (port as-is) vs. proxy rewrites (need Workers) before starting.

**Phase 1 — Audit** (completed)
- [x] Export all redirect and rewrite rules — `_redirects` reviewed; no `[redirects]` blocks in `netlify.toml`
- [x] Identify `200` proxy/rewrite rules — 4 rules: newsletter assets (2), Plausible JS, Plausible API event
- [x] List all custom headers — no `_headers` file or custom headers in `netlify.toml`
- [x] Audit Netlify-specific features — none in use (no Forms, Identity, Edge Functions, Analytics, Split Testing)
- [x] Note build command and output directory — `npm ci && npx @11ty/eleventy`, output dir `_site`, Node 24

**Phase 2 — Set up CF Pages** (completed)
- [x] Create new Pages project, connect same GitHub repo
- [x] Match build settings — build command: `npm ci && npx @11ty/eleventy`, output dir: `_site`, env var: `NODE_VERSION=24`
- [x] Confirm `_redirects` is in the build output root — passthrough copy in `eleventy.config.js`
- [x] Write Pages Function for proxy rules — `functions/_middleware.js` handles all 4 proxy/rewrite rules

**Phase 3 — Validate** (completed)
- [x] Confirm build succeeds on Cloudflare Pages
- [x] Verify proxy rules forward correctly — Plausible JS proxy returns 200
- [x] Verify redirect rules work — `/feed` returns 302 to `/feed.xml`

**Phase 4 — DNS cutover** (completed)
- [x] Add custom domain to CF Pages project
- [x] Smoke-test live domain — homepage, a redirect, a proxied route — all working
- [x] Confirmed `server: cloudflare` and `cf-ray` headers on live domain

**Phase 5 — Cleanup**
- [ ] Remove any leftover Netlify CNAME/A records from CF DNS — check for stale records still pointing to Netlify
- [ ] Delete or disable the Netlify site
- [x] Remove `netlify.toml` from repo
- [x] Update `CLAUDE.md` Deployment section to reflect CF Pages

### Improve image pipeline (build-time processing)

Currently images are manually resized before committing. Consider storing originals and processing at build time.

- [ ] Evaluate storing raw/original exports from Apple Photos (resized but otherwise unprocessed)
- [ ] Research build-time image resizing options compatible with Eleventy and Cloudflare Pages (e.g. `@11ty/eleventy-img`)
- [ ] Decide whether to adopt a build-time pipeline and document the approach

---

## Things to Avoid

- Do not add JavaScript beyond the existing Plausible analytics snippet
- Do not introduce CSS frameworks or preprocessors; the site uses a single minimal CSS file
- Do not change the permalink structure for existing posts (many redirects depend on `/archives/slug`)
- Do not commit large unoptimized images; resize to 1280px width first
- Do not add npm packages without strong justification; simplicity is a core principle

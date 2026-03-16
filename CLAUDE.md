# CLAUDE.md

This file provides guidance for AI assistants working with this repository.

## Project Overview

This is **benjaminchait.net**, a personal homepage and blog built with [Eleventy](https://www.11ty.dev/) (Node.js-based static site generator). The site is deployed on [Netlify](https://netlify.com) with the domain managed through Cloudflare.

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
_redirects           # Netlify redirect rules
about/               # About section pages and favorites/
assets/
  style.css          # Main stylesheet (single file, ~90 lines)
  img/               # All images (organized by section)
    posts/           # Blog post images (matched by date)
    about/           # About section images
    favicon_io/      # Favicon assets
.github/workflows/   # GitHub Actions CI
.well-known/         # Domain verification files
netlify.toml         # Netlify build configuration
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

- **CI:** GitHub Actions runs on pushes to `main` and on pull requests
- **Build:** `npm ci` then `npx @11ty/eleventy`
- **Hosting:** Netlify auto-deploys from the repository (configured in `netlify.toml`)
- **Analytics:** Plausible Analytics (privacy-focused), proxied through Netlify redirects
- **Redirects:** Managed in `_redirects` (Netlify format) for legacy WordPress URLs and service proxying

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
- `_redirects` - 70+ Netlify redirect rules (legacy URLs, proxies, service routing)
- `robots.txt` - Blocks AI crawlers (GPTBot, ClaudeBot, etc.) while allowing standard crawlers
- `feed.njk` - RSS feed template
- `.well-known/security.txt` - Security contact information

## Dates and Timestamps

Always use Pacific Time (`America/Los_Angeles`) for any dates or timestamps. Post dates use ISO 8601 format with timezone offset (e.g., `2024-01-15T12:00:00-07:00`).

## Active Projects / TODOs

### Rename `/assets/buttondown` proxy to `/assets/newsletter`

The `/assets/buttondown/*` proxy in `_redirects` is vendor-specific and should be renamed to the more generic `/assets/newsletter/*`. Newsletter assets (images, etc.) are stored in [benjaminchait/newsletter](https://github.com/benjaminchait/newsletter), deployed to `benjaminchait-newsletter.netlify.app`, and proxied through this site.

Steps:
- [ ] Add `/assets/newsletter/*` proxy rule in `_redirects` (same destination: `https://benjaminchait-newsletter.netlify.app/assets/:splat 200`)
- [ ] Keep `/assets/buttondown/*` rule with a deprecation comment (retain indefinitely, or remove after ~12 months from the switchover date)
- [ ] Update the comment block in `_redirects` to clarify the newsletter asset architecture
- [ ] Use `/assets/newsletter/` paths for any new post content going forward (no existing posts reference `/assets/buttondown/`)
- [ ] If the newsletter provider changes, update the `/newsletter` redirect on line 14 of `_redirects`

---

## Things to Avoid

- Do not add JavaScript beyond the existing Plausible analytics snippet
- Do not introduce CSS frameworks or preprocessors; the site uses a single minimal CSS file
- Do not change the permalink structure for existing posts (many redirects depend on `/archives/slug`)
- Do not commit large unoptimized images; resize to 1280px width first
- Do not add npm packages without strong justification; simplicity is a core principle

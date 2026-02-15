# CLAUDE.md

This file provides guidance for AI assistants working with this repository.

## Project Overview

This is **benjaminchait.net**, a personal homepage and blog built with [Eleventy](https://www.11ty.dev/) (Node.js-based static site generator). The site is deployed on [Netlify](https://netlify.com) with the domain managed through Cloudflare.

**Repository:** https://github.com/benjaminchait/www
**Live site:** https://benjaminchait.net

## Build & Development Commands

```bash
# Install dependencies
npm install

# Run local development server
npm run serve

# Build the site (outputs to _site/)
npm run build
```

**Node.js version:** 22 (specified in `.node-version`)
**Eleventy version:** 3.x (specified in `package.json`)

## Project Structure

```
eleventy.config.js   # Eleventy configuration (filters, collections, plugins)
package.json         # Node.js dependencies and scripts
_data/
  site.json          # Site metadata (title, URL, description)
  eleventyComputed.js # Computed data (permalink normalization, published handling)
_includes/           # Template partials (head.njk, footer.njk, favorites.njk)
_layouts/            # Page templates (default, home, page, post) as Nunjucks
_posts/              # Blog posts (YYYY-MM-DD-slug.md format)
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
```

### Template Hierarchy

```
default.njk          # Base HTML shell, includes head.njk
  ├── home.njk       # Homepage, includes footer.njk
  ├── page.njk       # Static pages, includes footer.njk
  └── post.njk       # Blog posts with prev/next nav, includes footer.njk
```

## Content Conventions

### Blog Posts

Posts live in `_posts/` with the naming pattern `YYYY-MM-DD-slug.md`.

**Required front matter:**
```yaml
---
layout: post
title: "Post Title"
description: "Short description for SEO/social"
published: true
date: YYYY-MM-DD HH:MM:SS -0700
permalink: /archives/slug
---
```

**Optional front matter:**
- `ogimage: /assets/img/path/to/image.jpeg` - OpenGraph image for social sharing

### Static Pages

Pages use `layout: page` and include a `permalink` in front matter.

### Images

- Blog post images go in `assets/img/posts/YYYY-MM-DD-slug/`
- Images are sized at **1280px width** (640px layout at 2x for retina)
- Use lowercase filenames with `.jpeg` extension
- Reference images in markdown with inline styles: `![alt text](/path){style="..."}`

## Styling

The site uses a single, minimal CSS file (`assets/style.css`):
- System font stack (`-apple-system, BlinkMacSystemFont, ...`)
- Max width: `40rem` with `2rem` padding
- Dark mode support via `@media (prefers-color-scheme: dark)`
- Link color: `#0074D9`
- Minimal class system: `.muted`, `.small`, `.not-muted`

## Deployment

- **CI:** GitHub Actions runs on pushes to `main` and on pull requests
- **Build:** `npm install` then `npm run build`
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
| `@11ty/eleventy-plugin-rss` | RSS feed generation |
| `markdown-it-attrs` | Markdown attribute syntax (`{style="..."}`) |

## Important Files

- `eleventy.config.js` - Eleventy configuration, custom filters, collections, passthrough copies
- `_data/site.json` - Site title, URL, description, social usernames
- `_redirects` - 70+ Netlify redirect rules (legacy URLs, proxies, service routing)
- `robots.txt` - Blocks AI crawlers (GPTBot, ClaudeBot, etc.) while allowing standard crawlers
- `netlify.toml` - Netlify build configuration
- `.well-known/security.txt` - Security contact information

## Things to Avoid

- Do not add JavaScript beyond the existing Plausible analytics snippet
- Do not introduce CSS frameworks or preprocessors; the site uses a single minimal CSS file
- Do not change the permalink structure for existing posts (many redirects depend on `/archives/slug`)
- Do not commit large unoptimized images; resize to 1280px width first
- Do not add npm packages without strong justification; simplicity is a core principle

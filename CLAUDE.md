# CLAUDE.md

This file provides guidance for AI assistants working with this repository.

## Project Overview

This is **benjaminchait.net**, a personal homepage and blog built with [Jekyll](https://jekyllrb.com/) (Ruby-based static site generator). The site is deployed on [Netlify](https://netlify.com) with the domain managed through Cloudflare.

**Repository:** https://github.com/benjaminchait/www
**Live site:** https://benjaminchait.net

## Build & Development Commands

```bash
# Install dependencies
bundle install

# Run local development server
bundle exec jekyll serve

# Build the site (outputs to _site/)
bundle exec jekyll build

# Validate generated HTML
bundle exec htmlproofer ./_site
```

**Ruby version:** 3.3.8 (specified in `.ruby-version`)
**Jekyll version:** 4.3.3 (pinned in `Gemfile`)

## Project Structure

```
_config.yml          # Jekyll site configuration
_includes/           # Template partials (head.html, footer.html)
_layouts/            # Page templates (default, home, page, post)
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
default.html         # Base HTML shell, includes head.html
  ├── home.html      # Homepage, includes footer.html
  ├── page.html      # Static pages, includes footer.html
  └── post.html      # Blog posts with prev/next nav, includes footer.html
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
- **Build:** `bundle install` then `bundle exec jekyll build`
- **Validation:** `htmlproofer` runs against `_site/` (non-blocking, failures don't break the build)
- **Hosting:** Netlify auto-deploys from the repository
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

| Gem | Purpose |
|-----|---------|
| `jekyll` 4.3.3 | Static site generator |
| `jekyll-sitemap` | Automatic XML sitemap generation |
| `html-proofer` | HTML link validation (dev/test only) |
| `csv`, `base64`, `logger` | Ruby stdlib compatibility gems |

## Important Files

- `_config.yml` - Site title, URL, plugins, timezone, included files
- `_redirects` - 70+ Netlify redirect rules (legacy URLs, proxies, service routing)
- `robots.txt` - Blocks AI crawlers (GPTBot, ClaudeBot, etc.) while allowing standard crawlers
- `feed.xml` - RSS feed template
- `.well-known/security.txt` - Security contact information

## Things to Avoid

- Do not add JavaScript beyond the existing Plausible analytics snippet
- Do not introduce CSS frameworks or preprocessors; the site uses a single minimal CSS file
- Do not change the permalink structure for existing posts (many redirects depend on `/archives/slug`)
- Do not commit large unoptimized images; resize to 1280px width first
- Do not add gems without strong justification; simplicity is a core principle

# Jekyll → Eleventy Migration Plan

## Goal
Replace Jekyll with Eleventy (11ty) as the static site generator. Zero end-user-facing changes — identical HTML output, same URLs, same styles, same feed.

---

## 1. Add Node.js project files (replace Ruby)

**Remove:**
- `Gemfile`, `Gemfile.lock`, `.ruby-version`

**Add:**
- `package.json` — with `@11ty/eleventy`, `markdown-it`, `markdown-it-attrs` (for `{:style="..."}` syntax), and `luxon` (for date formatting)
- `.node-version` — pin to Node 22 LTS
- `.eleventy.js` — main Eleventy config

No other npm dependencies needed. The site has no JS build step beyond static generation.

---

## 2. Eleventy configuration (`.eleventy.js`)

This is the heart of the migration. The config must:

### a) Markdown processing
- Use `markdown-it` with `markdown-it-attrs` plugin to support kramdown-style `{:style="..."}` attribute syntax on images and other elements
- This is the only non-trivial compatibility concern — 4 pages use `{:style="..."}` on images

### b) Layouts → Nunjucks templates
Convert the 4 layouts and 2 includes from Liquid to Nunjucks (`.njk`):

| Jekyll file | Eleventy file |
|---|---|
| `_layouts/default.html` | `_includes/default.njk` |
| `_layouts/home.html` | `_includes/home.njk` |
| `_layouts/page.html` | `_includes/page.njk` |
| `_layouts/post.html` | `_includes/post.njk` |
| `_includes/head.html` | `_includes/head.njk` |
| `_includes/footer.html` | `_includes/footer.njk` |

**Why Nunjucks?** Eleventy supports Liquid, but Jekyll's Liquid has non-standard extensions (`| relative_url`, `| escape`, etc.) that don't exist in standard Liquid. Nunjucks is Eleventy's most full-featured template language and avoids this friction.

### c) Template translation details

| Jekyll Liquid | Eleventy Nunjucks |
|---|---|
| `{{ site.title }}` | `{{ site.title }}` (via global data) |
| `{{ site.url }}` | `{{ site.url }}` |
| `{{ page.title }}` | `{{ title }}` |
| `{{ page.url }}` | `{{ page.url }}` |
| `{{ page.date \| date: "%-d %B %Y" }}` | `{{ page.date \| dateFormat }}` (custom filter) |
| `{{ content }}` | `{{ content \| safe }}` |
| `{{ post.title \| escape }}` | `{{ post.title \| escape }}` (built-in) |
| `{{ "/assets/style.css" \| relative_url }}` | `"/assets/style.css"` (hardcode, no base URL needed) |
| `{% for post in site.posts %}` | `{% for post in collections.posts \| reverse %}` |
| `{% if page.previous.url %}` | Custom previous/next via Eleventy collection navigation |
| `{% include head.html %}` | `{% include "head.njk" %}` |

### d) Collections
- Configure a `posts` collection from `_posts/*.md`
- Posts sorted by date (ascending by default in Eleventy; reverse where needed)
- Previous/next post navigation via `collections.posts` array indexing or Eleventy's built-in `page.previous`/`page.next` (available on collection items)

### e) Global data
Create `_data/site.json`:
```json
{
  "title": "Benjamin Chait",
  "email": "hello+www@benjaminchait.net",
  "description": "Benjamin's site",
  "url": "https://benjaminchait.net",
  "twitter_username": "benjaminchait",
  "github_username": "benjaminchait"
}
```
This replaces `_config.yml` for site-level variables.

### f) Custom filters
Register these in `.eleventy.js`:
- `dateFormat` — format dates like `"1 January 2024"` (replaces `| date: "%-d %B %Y"`)
- `dateRfc822` — format dates for RSS feed (replaces `| date: "%a, %d %b %Y %H:%M:%S %z"`)
- `stripHtml` — strip HTML tags (for RSS descriptions)

### g) Passthrough copies
Tell Eleventy to copy these unchanged:
- `assets/` (CSS, images, favicons, webmanifest)
- `_redirects`
- `.well-known/`
- `robots.txt`
- `keybase.txt`
- `waybackverify.txt`
- `feed.xsl`

### h) Output directory
Configure output to `_site/` (same as Jekyll) so Netlify config stays unchanged.

---

## 3. Blog post compatibility

### Front matter
Blog posts keep their existing markdown and front matter **as-is**. Key mappings:

- `layout: post` → works if Eleventy is configured to look up layouts from `_includes/`
- `permalink: /archives/slug` → Eleventy supports `permalink` in front matter natively
- `date:` → Eleventy reads this from front matter (and also from filename)
- `published: false` → Map to Eleventy's `eleventyExcludeFromCollections: true` + `permalink: false` via a computed data file
- `ogimage:` → passes through to templates as `ogimage` variable

### Directory data file
Add `_posts/_posts.json` to set defaults for all posts:
```json
{
  "layout": "post",
  "tags": "posts"
}
```
This auto-tags all posts into the `posts` collection and sets their default layout.

### `published: false` handling
Add a computed data file or use `.eleventy.js` config to filter out `published: false` posts from collections and suppress their output.

---

## 4. Feed template (`feed.xml`)

Convert `feed.xml` from Jekyll Liquid to Nunjucks (rename to `feed.njk` with `permalink: /feed.xml`). The template logic is straightforward — iterate over latest 10 posts, output RSS XML.

---

## 5. Archives page

Convert `archives.md` to use Nunjucks for the post listing loop. The current Liquid `{% for post in site.posts %}` becomes `{% for post in collections.posts | reverse %}`.

Options:
- Rename to `archives.njk` (cleanest)
- Or keep as `.md` with Nunjucks front matter permalink and a Nunjucks template for the list

---

## 6. CI/CD updates

### `.github/workflows/jekyll.yml` → `.github/workflows/eleventy.yml`
```yaml
name: Eleventy Build
on:
  push:
    branches: [main]
  pull_request:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npx @11ty/eleventy
      - uses: actions/upload-artifact@v4
        with:
          name: site
          path: _site
```

HTMLProofer can be kept via `npx html-validate` or a Node-based HTML checker, or dropped (it was already non-blocking with `|| true`).

---

## 7. Netlify build update

Either update `netlify.toml` (if it exists) or Netlify dashboard:
- **Build command:** `npx @11ty/eleventy`
- **Publish directory:** `_site`
- **Node version:** Set via `.node-version` or `NODE_VERSION` env var

Since the site currently relies on Netlify auto-detecting Jekyll, you may want to add a `netlify.toml`:
```toml
[build]
  command = "npx @11ty/eleventy"
  publish = "_site"
```

---

## 8. Files changed summary

| Action | Files |
|---|---|
| **Delete** | `Gemfile`, `Gemfile.lock`, `.ruby-version` |
| **Add** | `package.json`, `.node-version`, `.eleventy.js`, `_data/site.json`, `_posts/_posts.json`, `netlify.toml` |
| **Rename + Rewrite** | `_layouts/*.html` → `_includes/*.njk` (4 files), `_includes/*.html` → `_includes/*.njk` (2 files) |
| **Rewrite** | `feed.xml` → `feed.njk`, `archives.md` → `archives.njk` |
| **Rewrite** | `.github/workflows/jekyll.yml` → `.github/workflows/eleventy.yml` |
| **Update** | `CLAUDE.md` (update build commands and project description) |
| **Unchanged** | All `_posts/*.md`, all static pages (except archives), `assets/`, `_redirects`, `robots.txt`, `.well-known/`, all images |

---

## 9. Risk areas and mitigations

### a) Kramdown `{:style="..."}` attributes
**Risk:** 4 files use `{:style="float: left; width: 9rem; ..."}` on images.
**Mitigation:** `markdown-it-attrs` supports this syntax. Verified compatible.

### b) Previous/next post navigation
**Risk:** Jekyll auto-populates `page.previous` and `page.next`. Eleventy uses collection-based navigation.
**Mitigation:** In the post template, use Eleventy's `collections.posts` array. Each collection item has `data`, `url`, etc. Compute prev/next from the array index, or use the `eleventy-navigation` plugin. Note: Jekyll's previous/next is chronological (previous = older, next = newer), so match that ordering.

### c) Permalink consistency
**Risk:** Every post has an explicit `permalink:` in front matter — these must remain identical.
**Mitigation:** Eleventy respects `permalink` from front matter natively. Add trailing slash handling if needed.

### d) Sitemap generation
**Risk:** Jekyll used `jekyll-sitemap` plugin.
**Mitigation:** Use `@11ty/eleventy-plugin-sitemap` or generate a simple `sitemap.njk` template that iterates all pages/posts. The sitemap.xml plugin is a single npm dependency.

### e) Date/timezone handling
**Risk:** Jekyll uses `America/Los_Angeles` timezone from `_config.yml`. Posts have explicit timezone offsets in their `date:` front matter (e.g., `-0700`).
**Mitigation:** Since dates include timezone offsets, parsing is deterministic. Use `luxon` for formatting with explicit timezone.

### f) Excerpt generation
**Risk:** `feed.xml` uses `post.excerpt | strip_html` for RSS descriptions.
**Mitigation:** Eleventy can extract excerpts via a custom `excerpt` filter or by reading `post.data.description` (which all posts have in front matter). Using `description` is actually cleaner.

---

## 10. Implementation order

1. **Set up Node project** — `package.json`, `.eleventy.js`, `_data/site.json`
2. **Convert templates** — layouts and includes to Nunjucks
3. **Configure collections** — posts collection with directory data file
4. **Handle special pages** — archives, feed, 404
5. **Passthrough files** — assets, redirects, well-known, etc.
6. **Build and diff** — run both Jekyll and Eleventy builds, diff `_site/` output
7. **Update CI** — GitHub Actions workflow
8. **Add Netlify config** — `netlify.toml`
9. **Clean up** — remove Ruby files, update CLAUDE.md

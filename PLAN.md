# Image Optimization Plan

**Goal:** Move raw images out of `www` into a private source repo, run them through a processing pipeline, serve optimized variants (JPEG + WebP, 1x + 2x) from Cloudflare R2, and update all HTML/CSS to use `<picture>` with `srcset`.

---

## Overview

```
www-images-raw (private GitHub repo)
  └─ push new/changed images
       └─ GitHub Actions
            └─ Sharp: resize + convert to WebP
                 └─ Upload to Cloudflare R2
                      └─ https://img.benjaminchait.net/...
                           └─ www repo (Jekyll) references CDN URLs
                                └─ Netlify deploys the site
```

---

## Step 1: Create `www-images-raw` (private GitHub repo)

### Repository structure

Mirror the current `assets/img/` layout exactly:

```
www-images-raw/
  posts/
    2025-03-31-torres-del-paine/
      IMG_7923 1 Edited.jpeg        ← originals, untouched
      IMG_7955 4 Edited.jpeg
      ...
    2025-06-20-chicago/
    ...
  about/
    favorites/
      chicago/
      yosemite/
      ...
    lyra/
  og/
    memoji-bg.png                   ← default OG image
  scripts/
    process.js                      ← Sharp processing script
    upload.js                       ← R2 upload script
    migrate-posts.js                ← one-time migration helper
  package.json
  .github/
    workflows/
      process-and-upload.yml
```

### Migration: move images out of `www`

1. Copy `www/assets/img/posts/` → `www-images-raw/posts/`
2. Copy `www/assets/img/about/` → `www-images-raw/about/`
3. Copy `www/assets/img/memoji-bg.png` → `www-images-raw/og/memoji-bg.png`
4. **Keep** `www/assets/img/favicon_io/` in `www` — favicons are tiny and build-time artifacts
5. Delete `www/assets/img/posts/` and `www/assets/img/about/` from `www`

---

## Step 2: Image processing script (`scripts/process.js`)

Uses **[Sharp](https://sharp.pixelplumbing.com/)** (Node.js). No Ruby dependency; runs fast in CI.

### Output per input image

| Output file | Width | Format | Quality | Purpose |
|-------------|-------|--------|---------|---------|
| `{stem}-1280w.jpeg` | 1280px | JPEG | 85 | Retina 2x fallback |
| `{stem}-640w.jpeg` | 640px | JPEG | 85 | Standard 1x fallback |
| `{stem}-1280w.webp` | 1280px | WebP | 85 | Retina 2x, modern browsers |
| `{stem}-640w.webp` | 640px | WebP | 85 | Standard 1x, modern browsers |

The 1280px retina + 640px standard pair maps perfectly to the site's `40rem` (~640px) layout. Modern browsers pick WebP; older browsers get JPEG.

### Filename normalization

Raw filenames often contain spaces (e.g., `IMG_7923 1 Edited.jpeg`) and mixed case. The script normalizes the stem:

```
IMG_7923 1 Edited.jpeg  →  img_7923-1-edited-640w.webp
                              img_7923-1-edited-1280w.webp
                              img_7923-1-edited-640w.jpeg
                              img_7923-1-edited-1280w.jpeg
```

Rules: lowercase, spaces → hyphens, strip redundant punctuation.

### Script logic (`scripts/process.js`)

```javascript
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const glob = require('glob');

const INPUT_DIRS = ['posts', 'about', 'og'];
const SIZES = [640, 1280];
const FORMATS = [
  { ext: 'jpeg', options: { quality: 85, mozjpeg: true } },
  { ext: 'webp', options: { quality: 85 } },
];
const OUTPUT_DIR = process.env.OUTPUT_DIR || './processed';

function normalizeStem(filename) {
  return path.basename(filename, path.extname(filename))
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-_]/g, '');
}

async function processImage(inputPath, outputDir) {
  const stem = normalizeStem(inputPath);
  const relDir = path.dirname(inputPath).replace(/^(posts|about|og)/, '$1');
  const outDir = path.join(OUTPUT_DIR, relDir);
  fs.mkdirSync(outDir, { recursive: true });

  for (const width of SIZES) {
    for (const { ext, options } of FORMATS) {
      const outPath = path.join(outDir, `${stem}-${width}w.${ext}`);
      await sharp(inputPath)
        .resize(width, null, { withoutEnlargement: true })
        [ext](options)
        .toFile(outPath);
      console.log(`  ✓ ${outPath}`);
    }
  }
}

async function main() {
  const images = INPUT_DIRS.flatMap(dir =>
    glob.sync(`${dir}/**/*.{jpeg,jpg,png}`)
  );
  for (const img of images) {
    console.log(`Processing: ${img}`);
    await processImage(img, OUTPUT_DIR);
  }
}

main().catch(console.error);
```

### `package.json`

```json
{
  "name": "www-images-raw",
  "scripts": {
    "process": "node scripts/process.js",
    "upload": "node scripts/upload.js"
  },
  "dependencies": {
    "sharp": "^0.33.0",
    "glob": "^10.0.0",
    "@aws-sdk/client-s3": "^3.0.0"
  }
}
```

---

## Step 3: Cloudflare R2 setup

R2 is the right choice here: zero egress fees, S3-compatible API, and the domain already runs on Cloudflare so a custom subdomain is a two-click operation.

### Bucket configuration

1. Create bucket: `benjaminchait-images` (or similar) in the Cloudflare dashboard
2. Enable **Public access** on the bucket
3. Add a **Custom Domain**: `img.benjaminchait.net`
   - Cloudflare handles the DNS record automatically since the zone is already there

### Result

Processed images are served from: `https://img.benjaminchait.net/`

Example URLs:
```
https://img.benjaminchait.net/posts/2025-06-20-chicago/img_0922-1280w.webp
https://img.benjaminchait.net/posts/2025-06-20-chicago/img_0922-640w.jpeg
https://img.benjaminchait.net/og/memoji-bg-1280w.png
```

### Upload script (`scripts/upload.js`)

Uses the AWS SDK (R2 is S3-compatible):

```javascript
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const mime = require('mime-types');

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET;
const PROCESSED_DIR = './processed';

async function upload(localPath) {
  const key = path.relative(PROCESSED_DIR, localPath);
  const body = fs.readFileSync(localPath);
  const contentType = mime.lookup(localPath) || 'application/octet-stream';

  await client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  }));
  console.log(`  ↑ ${key}`);
}

async function main() {
  const files = glob.sync(`${PROCESSED_DIR}/**/*.*`);
  for (const file of files) {
    await upload(file);
  }
}

main().catch(console.error);
```

### Credentials (stored as GitHub Actions secrets)

| Secret | Description |
|--------|-------------|
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 API token key ID |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_BUCKET` | Bucket name |

---

## Step 4: GitHub Actions workflow (in `www-images-raw`)

```yaml
# .github/workflows/process-and-upload.yml
name: Process and Upload Images

on:
  push:
    branches: [main]
    paths:
      - 'posts/**'
      - 'about/**'
      - 'og/**'

jobs:
  process-and-upload:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Get changed image files
        id: changed
        run: |
          git diff --name-only HEAD~1 HEAD \
            -- 'posts/**' 'about/**' 'og/**' \
            > changed_files.txt
          echo "Changed files:"
          cat changed_files.txt

      - name: Process changed images
        run: |
          while IFS= read -r file; do
            if [ -f "$file" ]; then
              INPUT_FILE="$file" node scripts/process-single.js
            fi
          done < changed_files.txt

      - name: Upload processed images to R2
        env:
          R2_ACCOUNT_ID: ${{ secrets.R2_ACCOUNT_ID }}
          R2_ACCESS_KEY_ID: ${{ secrets.R2_ACCESS_KEY_ID }}
          R2_SECRET_ACCESS_KEY: ${{ secrets.R2_SECRET_ACCESS_KEY }}
          R2_BUCKET: ${{ secrets.R2_BUCKET }}
        run: node scripts/upload.js
```

For the initial bulk upload (all 875 images), run the scripts locally once:

```bash
npm run process   # ~5-10 min, outputs to ./processed/
npm run upload    # uploads all processed/ to R2
```

After that, the workflow handles only changed/new images on each push.

---

## Step 5: Jekyll changes

### 5a. CDN base URL in `_config.yml`

Add one line:

```yaml
image_cdn: "https://img.benjaminchait.net"
```

This makes it easy to change or override per-environment (e.g., a local mirror for development).

### 5b. New Jekyll include: `_includes/picture.html`

```liquid
{% comment %}
  Usage:
    {% include picture.html path="posts/2025-06-20-chicago/img_0922" alt="Caption" %}
    {% include picture.html path="posts/..." alt="..." class="dim-dark" %}

  Parameters:
    path  - image path stem relative to CDN root, without size suffix or extension
            e.g. "posts/2025-06-20-chicago/img_0922"
    alt   - alt text (required)
    class - optional CSS class(es) on the <img> element
{% endcomment %}

{% assign cdn = site.image_cdn %}
{% assign p = include.path %}

<picture>
  <source
    type="image/webp"
    srcset="{{ cdn }}/{{ p }}-640w.webp 640w,
            {{ cdn }}/{{ p }}-1280w.webp 1280w"
    sizes="(max-width: 40rem) 100vw, 40rem">
  <img
    src="{{ cdn }}/{{ p }}-1280w.jpeg"
    srcset="{{ cdn }}/{{ p }}-640w.jpeg 640w,
            {{ cdn }}/{{ p }}-1280w.jpeg 1280w"
    sizes="(max-width: 40rem) 100vw, 40rem"
    alt="{{ include.alt }}"
    loading="lazy"
    decoding="async"
    {% if include.class %}class="{{ include.class }}"{% endif %}>
</picture>
```

**What this gives you:**

- Modern browsers (Chrome, Firefox, Safari): receive WebP, picking 640w or 1280w based on screen density
- Older browsers: receive JPEG fallback
- `loading="lazy"` defers off-screen images (zero JS required)
- `decoding="async"` keeps the main thread free during decode
- `sizes` matches the `40rem` layout max-width so browsers calculate the right variant

### 5c. OG image include: `_includes/og-image.html`

For the default and per-post OG images, update `_includes/head.html` to reference the CDN:

```html
{% if page.ogimage %}
  <meta property="og:image" name="twitter:image" content="{{ page.ogimage }}">
{% else %}
  <meta property="og:image" name="twitter:image" content="{{ site.image_cdn }}/og/memoji-bg-1280w.jpeg">
{% endif %}
```

Per-post `ogimage` front matter will be updated to full CDN URLs during migration (see Step 7).

---

## Step 6: CSS changes (`assets/style.css`)

Three targeted changes:

### Remove dark mode image filter from global `img` rule

```css
/* BEFORE */
@media (prefers-color-scheme: dark) {
  img {
    filter: brightness(.8) contrast(1.2);
  }
}

/* AFTER — removed; use .dim-dark class instead */
```

### Add opt-in dark mode filter class

```css
@media (prefers-color-scheme: dark) {
  .dim-dark {
    filter: brightness(.8) contrast(1.2);
  }
}
```

Apply `class="dim-dark"` in posts where you want it (e.g., screenshots, UI images — not photos).

### Fix img block layout

```css
img {
  max-width: 100%;
  height: auto;      /* prevents distortion when width attr is set */
  display: block;    /* eliminates inline baseline gap */
}

picture {
  display: block;
}
```

### No other CSS changes

The existing `40rem` / `2rem` system is correct. The `sizes` attribute in the `<picture>` include handles breakpoint-aware image selection.

---

## Step 7: Migrate existing posts and pages

### 7a. Script (`scripts/migrate-posts.js` — runs in `www` repo)

A Node.js migration script that:

1. Reads each `.md` file in `_posts/` and `about/`
2. Finds reference-style image links: `[n]: /assets/img/posts/YYYY-MM-DD-slug/IMG_1234.jpeg`
3. Normalizes the filename stem (same logic as the processing script)
4. Replaces the markdown image syntax `![alt text][n]` with `{% include picture.html path="..." alt="..." %}`
5. Updates `ogimage:` front matter to the full CDN URL
6. Removes the trailing `[n]: url` reference block

The script outputs a summary of every change for review before committing.

### 7b. About pages with grid layouts

The about pages use inline styles for multi-column and centered layouts:

```markdown
![alt](/assets/img/...){:style="width: 32%; max-width: 200px;"}
```

These become:

```liquid
{% include picture.html path="about/favorites/chicago/stem" alt="alt" class="img-col-3" %}
```

Add two utility classes to `style.css`:

```css
/* Three-column image grid (used in about/favorites pages) */
.img-col-3 {
  display: inline-block;
  width: 32%;
  max-width: 200px;
}

/* Centered portrait image (used in about/lyra, about/luna) */
.img-portrait {
  max-width: 300px;
  margin: 0 auto;
}
```

### 7c. Scope of migration

| Location | Count | Image pattern |
|----------|-------|---------------|
| `_posts/` with images | 86 posts | Reference-style `[n]: /assets/img/...` |
| `about/favorites/` | 6 pages | Inline `![alt](url){:style="..."}` |
| `about/lyra.md` | 1 page | Inline with centered style |
| `about/luna.md` (via post ref) | 1 page | Standard inline |
| `_includes/head.html` | 1 file | OG image fallback |
| `ogimage:` front matter | ~60 posts | Full CDN URL needed |

---

## Step 8: Order of operations

1. **Create `www-images-raw`** — private repo, push originals, set up R2 secrets
2. **R2 setup** — create bucket, custom domain `img.benjaminchait.net`
3. **Run bulk processing + upload locally** — this is the one-time initial upload
4. **Add GitHub Actions workflow** to `www-images-raw` for future images
5. **Update `www` repo:**
   a. Add `image_cdn` to `_config.yml`
   b. Add `_includes/picture.html`
   c. Update CSS (`style.css`)
   d. Run migration script against `_posts/` and `about/`
   e. Update `_includes/head.html` for OG image CDN URL
   f. Delete `assets/img/posts/` and `assets/img/about/` (keep `favicon_io/`)
6. **Test locally** with `bundle exec jekyll serve` — verify images load from CDN
7. **Push to `main`** — Netlify deploys

---

## Expected outcomes

| Metric | Before | After |
|--------|--------|-------|
| `www` repo image size | ~313MB | ~0MB (favicons only, ~50KB) |
| Image formats served | JPEG only | WebP (primary) + JPEG (fallback) |
| Responsive variants | 1 (1280px, always) | 2 (640w + 1280w, browser picks) |
| Lazy loading | None | All images lazy-loaded |
| Dark mode filter | Global (all images) | Opt-in via `.dim-dark` class |
| CDN caching | Netlify CDN | Cloudflare global edge (R2) |
| Git clone size | ~320MB | ~5MB |
| New image workflow | Drop into `assets/img/`, commit | Drop into `www-images-raw/`, push |

---

## Open questions for implementation

- **Local development**: When running `jekyll serve` locally, images won't load unless you're connected to the internet (they'll be on R2). If you want local preview of draft posts with new images, a `.env`-based `image_cdn` override pointing to a local directory is possible but adds complexity. Simplest answer: development uses CDN, same as production.

- **Filename collisions**: Two different posts theoretically could have a file named `img_0001.jpeg`. The path-based directory structure (`posts/YYYY-MM-DD-slug/`) prevents this — the normalized stem only needs to be unique within its directory.

- **`posts-1280px-portrait/`**: This legacy directory (61 images, no active post references) can be archived to `www-images-raw` and deleted from `www` without any markdown changes needed.

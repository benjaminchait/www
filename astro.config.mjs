import { defineConfig } from "astro/config";
import remarkKramdownAttrs from "./src/lib/remark-kramdown-attrs.mjs";
import remarkBuildTime from "./src/lib/remark-build-time.mjs";

export default defineConfig({
  site: "https://benjaminchait.net",
  trailingSlash: "never",
  build: {
    // Output flat files (about.html, archives/slug.html) to match the
    // extensionless URLs served by the Cloudflare ASSETS binding.
    format: "file",
  },
  // Keep human-readable HTML output (closer to the Eleventy output).
  compressHTML: false,
  markdown: {
    // Match the previous markdown-it configuration: no smart quotes, no
    // syntax highlighting markup in code blocks.
    smartypants: false,
    syntaxHighlight: false,
    // markdown-it's default had no autolinking of bare URLs/emails (linkify
    // was off), and no content uses tables or strikethrough — so GFM off.
    gfm: false,
    remarkPlugins: [remarkKramdownAttrs, remarkBuildTime],
  },
});

const { DateTime } = require("luxon");
const markdownIt = require("markdown-it");
const markdownItAttrs = require("markdown-it-attrs");

module.exports = function (eleventyConfig) {
  // Markdown: use markdown-it with attrs plugin for kramdown-style {:style="..."} syntax
  const md = markdownIt({ html: true, breaks: false, linkify: false });
  md.use(markdownItAttrs, {
    leftDelimiter: "{:",
    rightDelimiter: "}",
  });
  eleventyConfig.setLibrary("md", md);

  // --- Filters ---

  // Date formatting: "1 January 2024"
  eleventyConfig.addFilter("dateFormat", (date) => {
    return DateTime.fromJSDate(new Date(date), { zone: "America/Los_Angeles" }).toFormat("d MMMM yyyy");
  });

  // Date formatting for RSS: "Mon, 01 Jan 2024 12:00:00 -0700"
  eleventyConfig.addFilter("dateRfc822", (date) => {
    return DateTime.fromJSDate(new Date(date), { zone: "America/Los_Angeles" }).toFormat("ccc, dd MMM yyyy HH:mm:ss ZZZ");
  });

  // Date formatting: "2024.01.01"
  eleventyConfig.addFilter("dateDotFormat", (date) => {
    return DateTime.fromJSDate(new Date(date), { zone: "America/Los_Angeles" }).toFormat("yyyy.MM.dd");
  });

  // Date formatting for colophon "now": "16 March 2026 14:30"
  eleventyConfig.addFilter("dateNow", () => {
    return DateTime.now().setZone("America/Los_Angeles").toFormat("d MMMM yyyy HH:mm");
  });

  // Strip HTML tags
  eleventyConfig.addFilter("stripHtml", (str) => {
    if (!str) return "";
    return str.replace(/<[^>]+>/g, "");
  });

  // Normalize whitespace
  eleventyConfig.addFilter("normalizeWhitespace", (str) => {
    if (!str) return "";
    return str.replace(/\s+/g, " ").trim();
  });

  // XML escape
  eleventyConfig.addFilter("xmlEscape", (str) => {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  });

  // Strip trailing slash from a URL (unless it's the root "/")
  eleventyConfig.addFilter("stripTrailingSlash", (url) => {
    if (!url || url === "/") return url;
    return url.replace(/\/$/, "");
  });

  // --- Collections ---

  // Posts collection: all files in _posts/, sorted by date ascending
  eleventyConfig.addCollection("posts", function (collectionApi) {
    return collectionApi
      .getFilteredByGlob("_posts/*.md")
      .filter((item) => item.data.published !== false)
      .sort((a, b) => a.date - b.date);
  });

  // --- Passthrough copies ---
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("_redirects");
  eleventyConfig.addPassthroughCopy(".well-known");
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("keybase.txt");
  eleventyConfig.addPassthroughCopy("waybackverify.txt");
  eleventyConfig.addPassthroughCopy("about/imessage-contact-key-verification.txt");

  // --- Handle published: false ---
  // Prevent unpublished content from being written
  eleventyConfig.addGlobalData("eleventyComputed", {
    eleventyExcludeFromCollections: (data) => {
      if (data.published === false) return true;
      return data.eleventyExcludeFromCollections;
    },
    permalink: (data) => {
      if (data.published === false) return false;
      // Add trailing slash to permalinks without file extensions
      if (data.permalink && typeof data.permalink === "string" && !data.permalink.match(/\.\w+$/) && !data.permalink.endsWith("/")) {
        return data.permalink + "/";
      }
      return data.permalink;
    },
  });

  // --- Sitemap: exclude pages with sitemap: false ---
  eleventyConfig.addCollection("sitemap", function (collectionApi) {
    return collectionApi.getAll().filter((item) => {
      return item.data.published !== false && item.data.sitemap !== false;
    });
  });

  return {
    dir: {
      input: ".",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["md", "njk", "html"],
  };
};

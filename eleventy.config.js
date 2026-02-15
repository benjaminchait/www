const { feedPlugin } = require("@11ty/eleventy-plugin-rss");
const markdownItAttrs = require("markdown-it-attrs");
const yaml = require("js-yaml");

// Custom YAML schema that handles Jekyll-style date formats: "YYYY-MM-DD HH:MM:SS -ZZZZ"
const JEKYLL_DATE_TYPE = new yaml.Type("tag:yaml.org,2002:timestamp", {
  kind: "scalar",
  resolve(data) {
    return /^\d{4}-\d{2}-\d{2}(\s+\d{2}:\d{2}:\d{2}(\s+[+-]\d{4})?)?$/.test(
      data
    );
  },
  construct(data) {
    const match = data.match(
      /^(\d{4}-\d{2}-\d{2})(?:\s+(\d{2}:\d{2}:\d{2})(?:\s+([+-]\d{2})(\d{2}))?)?$/
    );
    if (match && match[2] && match[3]) {
      return new Date(`${match[1]}T${match[2]}${match[3]}:${match[4]}`);
    }
    return new Date(data);
  },
  instanceOf: Date,
  represent(date) {
    return date.toISOString();
  },
});

const JEKYLL_YAML_SCHEMA = yaml.DEFAULT_SCHEMA.extend({
  implicit: [JEKYLL_DATE_TYPE],
});

module.exports = function (eleventyConfig) {
  // --- Front Matter Parsing ---
  // Use custom YAML schema to handle Jekyll-style date formats
  eleventyConfig.setFrontMatterParsingOptions({
    engines: {
      yaml: (str) => yaml.load(str, { schema: JEKYLL_YAML_SCHEMA }),
    },
  });

  // --- Ignores ---
  eleventyConfig.ignores.add("README.md");
  eleventyConfig.ignores.add("CLAUDE.md");

  // --- Markdown Configuration ---
  eleventyConfig.amendLibrary("md", (mdLib) => {
    mdLib.use(markdownItAttrs);
  });

  // --- Plugins ---
  eleventyConfig.addPlugin(feedPlugin, {
    type: "rss",
    outputPath: "/feed.xml",
    collection: {
      name: "posts",
      limit: 10,
    },
    metadata: {
      language: "en",
      title: "Benjamin Chait",
      subtitle: "Benjamin's site",
      base: "https://benjaminchait.net/",
      author: {
        name: "Benjamin Chait",
      },
    },
  });

  // --- Collections ---
  eleventyConfig.addCollection("posts", function (collectionApi) {
    const posts = collectionApi
      .getFilteredByGlob("_posts/**/*.md")
      .filter((p) => p.data.published !== false)
      .sort((a, b) => a.date - b.date);

    // Add previous/next references matching Jekyll behavior
    // Jekyll's site.posts is reverse-chronological; page.previous = newer, page.next = older
    for (let i = 0; i < posts.length; i++) {
      posts[i].data.previousPost =
        i < posts.length - 1 ? posts[i + 1] : null;
      posts[i].data.nextPost = i > 0 ? posts[i - 1] : null;
    }

    return posts;
  });

  // --- Filters ---
  // Match Jekyll's timezone: America/Los_Angeles (from _config.yml)
  const TZ = "America/Los_Angeles";

  eleventyConfig.addFilter("readableDate", function (date) {
    const d = new Date(date);
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: TZ,
      day: "numeric",
      month: "long",
      year: "numeric",
    }).formatToParts(d);
    const day = parts.find((p) => p.type === "day").value;
    const month = parts.find((p) => p.type === "month").value;
    const year = parts.find((p) => p.type === "year").value;
    return `${day} ${month} ${year}`;
  });

  eleventyConfig.addFilter("buildDate", function () {
    const d = new Date();
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: TZ,
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(d);
    const day = parts.find((p) => p.type === "day").value;
    const month = parts.find((p) => p.type === "month").value;
    const year = parts.find((p) => p.type === "year").value;
    const hour = parts.find((p) => p.type === "hour").value;
    const minute = parts.find((p) => p.type === "minute").value;
    return `${day} ${month} ${year} ${hour}:${minute}`;
  });

  eleventyConfig.addFilter("xmlEscape", function (str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  });

  eleventyConfig.addFilter("rfc822Date", function (date) {
    const d = new Date(date);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const day = days[d.getUTCDay()];
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const mon = months[d.getUTCMonth()];
    const yyyy = d.getUTCFullYear();
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    const ss = String(d.getUTCSeconds()).padStart(2, "0");
    return `${day}, ${dd} ${mon} ${yyyy} ${hh}:${mm}:${ss} +0000`;
  });

  eleventyConfig.addFilter("escape", function (str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  });

  // --- Passthrough File Copy ---
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("_redirects");
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("keybase.txt");
  eleventyConfig.addPassthroughCopy("waybackverify.txt");
  eleventyConfig.addPassthroughCopy(".well-known");
  eleventyConfig.addPassthroughCopy("about/imessage-contact-key-verification.txt");

  return {
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dir: {
      input: ".",
      output: "_site",
      includes: "_includes",
      layouts: "_layouts",
      data: "_data",
    },
  };
};

const pluginRss = require("@11ty/eleventy-plugin-rss");
const markdownIt = require("markdown-it");
const markdownItAttrs = require("markdown-it-attrs");
const he = require("he");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(pluginRss);

  eleventyConfig.addPassthroughCopy({
    "assets": "assets",
    "_redirects": "_redirects",
    ".well-known": ".well-known",
    "robots.txt": "robots.txt",
    "keybase.txt": "keybase.txt",
    "waybackverify.txt": "waybackverify.txt"
  });

  eleventyConfig.addFilter("xml_escape", (value) => {
    if (!value) return "";
    return he.encode(value, { useNamedReferences: true });
  });

  const markdownLib = markdownIt({
    html: true,
    breaks: true,
    linkify: true
  }).use(markdownItAttrs);
  eleventyConfig.setLibrary("md", markdownLib);

  eleventyConfig.addCollection("postsByDate", (collectionApi) =>
    collectionApi
      .getFilteredByGlob("posts/**/*.md")
      .filter((item) => item.data.published !== false)
      .sort((a, b) => b.date - a.date)
  );

  eleventyConfig.addGlobalData("eleventyComputed", {
    eleventyExcludeFromCollections: (data) => data.published === false,
    permalink: (data) => (data.published === false ? false : data.permalink)
  });

  eleventyConfig.addGlobalData("buildTime", () => new Date());

  return {
    templateFormats: ["md", "njk", "html", "liquid"],
    markdownTemplateEngine: "liquid",
    htmlTemplateEngine: "liquid",
    dir: {
      input: ".",
      includes: "_includes",
      data: "_data",
      layouts: "_layouts"
    }
  };
};

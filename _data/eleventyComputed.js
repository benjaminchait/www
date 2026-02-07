module.exports = {
  permalink: (data) => {
    if (data.published === false) {
      return false;
    }
    // Add trailing slash to permalinks without file extensions
    // (matches Jekyll's behavior of creating /path/index.html)
    if (data.permalink && !data.permalink.match(/\.\w+$/) && !data.permalink.endsWith("/")) {
      return data.permalink + "/";
    }
    return data.permalink;
  },
  eleventyExcludeFromCollections: (data) => {
    if (data.published === false) {
      return true;
    }
    return data.eleventyExcludeFromCollections;
  },
};

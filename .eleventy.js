module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy('assets');
  eleventyConfig.addPassthroughCopy('.well-known');
  eleventyConfig.addPassthroughCopy('_redirects');
  eleventyConfig.addPassthroughCopy('robots.txt');
  eleventyConfig.addPassthroughCopy('keybase.txt');
  eleventyConfig.addPassthroughCopy('waybackverify.txt');

  eleventyConfig.addCollection('posts', function(collectionApi) {
    return collectionApi.getFilteredByGlob('posts/**/*.{md,markdown}').sort((a,b) => b.date - a.date);
  });

  return {
    dir: {
      input: '.',
      includes: '_includes',
      layouts: '_layouts',
      output: '_site'
    }
  };
};

# www - personal homepage

## Built by [Benjamin Chait](https://github.com/benjaminchait)

### Basics

**www** is a [Jekyll](https://jekyllrb.com/)-generated static site. My [production](https://benjaminchait.net) instance is deployed using [Netlify](http://netlify.com). You can learn more using [their lovely documentation](https://www.netlifycms.org/docs/jekyll/) or by sending me a note to ask a question.

[![Netlify Status](https://api.netlify.com/api/v1/badges/9a0fb88e-0850-488a-836f-db212ed26790/deploy-status)](https://app.netlify.com/sites/benjaminchait-www/deploys)

### Principles

Writing a few words about my general approach. These are not set in stone, but some guiding principles in how this site is designed and meant to work...

* **Keep it simple:** When possible, bias toward repeatability, scalability, and avoiding custom/proprietary tooling. As a statically-generated site, the _technology_ should be replaceable in the future with minimal impact.
* **Focus on content:** As a personal site, the text and images are paramount. Keeping content managed in a clear, easy-to-understand manner is really helpful for others to learn from, but also for my future self :)
* **Speed is usability:** Even with modern devices, bandwidth and processing impact the experience. This might be more critical to developing/pushing updates; but would be evident if serving original, high-resolution photos (rather than those which are optimized for this layout).
* **Build scaleable workflows:** Images are currently sized at 1280px (which is 640px @ 2x for high-res "retina" devices); but are typically sourced from much larger source files. When possible, ensure a scalable workflow to generate and replace those images in the future.
* **Work in public:** Personal websites have changed a lot over the years; share how this is built, offer guidance and support, and help others to participate in the web.
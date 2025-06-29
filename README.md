# www - personal homepage

## Built by [Benjamin Chait](https://github.com/benjaminchait)

[![Netlify Status](https://api.netlify.com/api/v1/badges/03380659-40f5-4cac-8758-c564f5467d07/deploy-status)](https://app.netlify.com/sites/benjaminchait-www/deploys)

### Basics

**www** is a [Jekyll](https://jekyllrb.com/)-generated static site. My [production](https://benjaminchait.net) instance is deployed using [Netlify](http://netlify.com).

##### Newsletter

In my [_redirects](https://github.com/benjaminchait/www/blob/0fe01edc508cb4386a4368fcdbe970f5e4076c91/_redirects#L15) config, I link this repository with https://github.com/benjaminchait/newsletter for serving media when sent via email.

### Principles

Writing a few words about my general approach. These are not set in stone, but some guiding principles in how this site is designed and meant to work...

* **Keep it simple:** When possible, bias toward repeatability, scalability, and avoiding custom/proprietary tooling. As a statically-generated site, the _technology_ should be replaceable in the future with minimal impact.
* **Focus on content:** As a personal site, the text and images are paramount. Keeping content managed in a clear, easy-to-understand manner is really helpful for others to learn from, but also for my future self :)
* **Speed is usability:** Even with modern devices, bandwidth and processing impact the experience. This might be more critical to developing/pushing updates; but would be evident if serving original, high-resolution photos (rather than those which are optimized for this layout).
* **Build scalable workflows:** Images are currently sized at 1280px (which is 640px @ 2x for high-res "retina" devices); but are typically sourced from much larger source files. When possible, ensure a scalable workflow to generate and replace those images in the future.
* **Work in public:** Personal websites have changed a lot over the years; share how this is built, offer guidance and support, and help others to participate in the web.

### History

* 2003: Registered my full name as a dot net URL, hosted on Media Temple. Went through a number of iterations: hand-crafted HTML pages, a bespoke CMS running a very simple SQL database (which I later accidentally "dropped" resulting in me learning the value of backups), and eventually running WordPress.
* 2013: Spun-up an instance with Digital Ocean, continued on WordPress.
* 2020: Migrated to a statically-generated site powered by Netlify, though most content was just copied from the `wp-content` downloaded from my DO instance.
* 2022: _Finally_ cleaned-up the directory structure and properly updated all the images and content.

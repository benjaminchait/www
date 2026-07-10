import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Blog posts stay in _posts/ (YYYY-MM-DD-slug.md), same as under Eleventy.
const posts = defineCollection({
  loader: glob({ pattern: "*.md", base: "./_posts" }),
  schema: z
    .object({
      title: z.string(),
      description: z.string().optional(),
      published: z.boolean().default(true),
      date: z.coerce.date(),
      permalink: z.string(),
      ogimage: z.string().optional(),
      location: z.string().optional(),
      external: z.string().optional(),
    })
    .passthrough(),
});

// Standalone pages stay at their original paths in the repo.
const pages = defineCollection({
  loader: glob({
    pattern: ["index.md", "404.md", "about.md", "about/**/*.md", "2024-pdx-visit/index.md"],
    base: ".",
  }),
  schema: z
    .object({
      title: z.coerce.string().optional(),
      description: z.string().optional(),
      layout: z.enum(["default.njk", "page.njk", "home.njk"]).default("page.njk"),
      published: z.boolean().default(true),
      permalink: z.string().optional(),
      ogimage: z.string().optional(),
      sitemap: z.boolean().default(true),
      favorites_nav: z.boolean().default(false),
    })
    .passthrough(),
});

export const collections = { posts, pages };

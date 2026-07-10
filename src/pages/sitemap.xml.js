// Sitemap, ported from sitemap.njk: all published pages and posts except
// those with `sitemap: false`. Pages without a date use the build time as
// lastmod (Eleventy used the file's mtime, which is the checkout time in CI).
import { getCollection } from "astro:content";
import site from "../../_data/site.json";
import { dateRfc822 } from "../lib/dates.mjs";

export async function GET() {
  const buildTime = new Date();

  const pages = await getCollection(
    "pages",
    (p) => p.data.published && p.data.sitemap && p.id !== "404",
  );
  const posts = (await getCollection("posts", (p) => p.data.published))
    .sort((a, b) => a.data.date - b.data.date);

  const entries = [
    // Homepage, then standalone pages, then the archives index, then posts.
    { path: "/", date: buildTime },
    ...pages
      .filter((p) => p.id !== "index")
      .map((p) => ({ path: p.data.permalink, date: buildTime })),
    { path: "/archives", date: buildTime },
    ...posts.map((p) => ({ path: p.data.permalink, date: p.data.date })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) => `  <url>
    <loc>${site.url}${e.path === "/" ? "/" : e.path}</loc>
    <lastmod>${dateRfc822(e.date)}</lastmod>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

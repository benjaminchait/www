// RSS feed, ported from feed.njk. Renders the 10 most recent posts with
// full HTML content via Astro's container API.
import { getCollection, render } from "astro:content";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import site from "../../_data/site.json";
import { dateRfc822 } from "../lib/dates.mjs";
import { xmlEscape } from "../lib/xml.mjs";

export async function GET() {
  const posts = (await getCollection("posts", (p) => p.data.published))
    .sort((a, b) => a.data.date - b.data.date);

  const latestPost = posts[posts.length - 1];
  const recentPosts = [...posts].reverse().slice(0, 10);

  const container = await AstroContainer.create();
  const items = [];
  for (const post of recentPosts) {
    const { Content } = await render(post);
    const html = await container.renderToString(Content);
    const url = site.url + post.data.permalink;
    items.push(`    <item>
      <title>${xmlEscape(post.data.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${dateRfc822(post.data.date)}</pubDate>
      <description>${xmlEscape(post.data.description)}</description>
      <content:encoded><![CDATA[${html}]]></content:encoded>
    </item>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/feed.xsl"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${xmlEscape(site.title)}</title>
    <link>${site.url}</link>
    <description>${xmlEscape(site.description)}</description>
    <lastBuildDate>${dateRfc822(latestPost.data.date)}</lastBuildDate>
${items.join("\n")}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

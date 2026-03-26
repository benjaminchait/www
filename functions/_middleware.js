// Cloudflare Pages Function: proxy/rewrite rules
// These were previously 200-status rewrites in Netlify's _redirects file.
// CF Pages _redirects does not support proxy rewrites, so they live here instead.
//
// Note: /assets/newsletter/* and /assets/buttondown/* are handled directly by the
// newsletter Cloudflare Worker via Worker Routes (see benjaminchait/newsletter repo).

const PROXY_ROUTES = [
  {
    pattern: /^\/pio\/js\/(pa-APRvGagy0VA6BeYF-WUim\.js)$/,
    target: "https://plausible.io/js/$1",
  },
  {
    pattern: /^\/pio\/api\/event$/,
    target: "https://plausible.io/api/event",
  },
];

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  for (const route of PROXY_ROUTES) {
    const match = path.match(route.pattern);
    if (match) {
      // Build the upstream URL by replacing capture groups
      let upstream = route.target;
      for (let i = 1; i < match.length; i++) {
        upstream = upstream.replace(`$${i}`, match[i]);
      }

      // Forward the original request to the upstream, preserving method/headers/body
      const proxyRequest = new Request(upstream, {
        method: context.request.method,
        headers: context.request.headers,
        body: context.request.method !== "GET" && context.request.method !== "HEAD"
          ? context.request.body
          : undefined,
        redirect: "follow",
      });

      const response = await fetch(proxyRequest);

      // Return upstream response with CORS-safe headers
      const headers = new Headers(response.headers);
      headers.delete("set-cookie");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }
  }

  // No proxy match — pass through to static assets / _redirects
  return context.next();
}

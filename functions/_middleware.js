// Cloudflare Pages Function: proxy/rewrite rules
// CF Pages _redirects does not support proxy rewrites, so they live here instead.

const PROXY_ROUTES = [
  {
    pattern: /^\/assets\/newsletter\/(.+)$/,
    target: "https://newsletter.benjaminchait.workers.dev/assets/newsletter/$1",
  },
  {
    // Deprecated: renamed to /assets/newsletter/* (March 2026); retained for backwards compatibility
    pattern: /^\/assets\/buttondown\/(.+)$/,
    target: "https://newsletter.benjaminchait.workers.dev/assets/buttondown/$1",
  },
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

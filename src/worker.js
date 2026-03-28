// Cloudflare Worker: proxy/rewrite rules + static asset serving
//
// Handles proxy routes before falling through to static assets.
// Static assets (in _site/) are served via the ASSETS binding,
// which also honors _redirects (301/302 only).

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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    for (const route of PROXY_ROUTES) {
      const match = path.match(route.pattern);
      if (match) {
        // Build the upstream URL by replacing capture groups
        let upstream = route.target;
        for (let i = 1; i < match.length; i++) {
          upstream = upstream.replace(`$${i}`, match[i]);
        }

        // Copy headers, but remove Host so the fetch sets the correct upstream host.
        // Also forward the real client IP for Plausible analytics.
        const headers = new Headers(request.headers);
        headers.delete("host");
        const clientIp = request.headers.get("CF-Connecting-IP");
        if (clientIp) headers.set("X-Forwarded-For", clientIp);

        const proxyRequest = new Request(upstream, {
          method: request.method,
          headers,
          body: request.method !== "GET" && request.method !== "HEAD"
            ? request.body
            : undefined,
          redirect: "follow",
        });

        const response = await fetch(proxyRequest);

        // Return upstream response, stripping set-cookie
        const responseHeaders = new Headers(response.headers);
        responseHeaders.delete("set-cookie");

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
        });
      }
    }

    // No proxy match — serve static assets (honors _redirects automatically)
    return env.ASSETS.fetch(request);
  },
};

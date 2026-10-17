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

const VIDEO_PREFIX = "/assets/video/";

// Serve a video from the R2 "www-video" bucket, with Range support so browsers can
// seek and iOS can play. Keys under "originals/" are archive copies and stay private.
async function serveVideo(request, env, key) {
  if (!key || key.startsWith("originals/") || key.includes("..")) {
    return new Response("Not found", { status: 404 });
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  }

  const object = request.method === "HEAD"
    ? await env.VIDEO.head(key)
    : await env.VIDEO.get(key, { range: request.headers, onlyIf: request.headers });
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("ETag", object.httpEtag);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/octet-stream");

  // Conditional request that didn't match: R2 returns metadata only, no body.
  if (request.method === "GET" && !("body" in object)) {
    return new Response(null, { status: 304, headers });
  }

  let status = 200;
  if (object.range && request.headers.has("Range")) {
    const { offset = 0, length = object.size - offset } = object.range;
    headers.set("Content-Range", `bytes ${offset}-${offset + length - 1}/${object.size}`);
    headers.set("Content-Length", String(length));
    status = 206;
  } else {
    headers.set("Content-Length", String(object.size));
  }

  return new Response(request.method === "HEAD" ? null : object.body, { status, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.startsWith(VIDEO_PREFIX)) {
      let key;
      try {
        key = decodeURIComponent(path.slice(VIDEO_PREFIX.length));
      } catch {
        return new Response("Bad request", { status: 400 });
      }
      return serveVideo(request, env, key);
    }

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
